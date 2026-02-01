import "server-only";

import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

let instancePromise: Promise<Kuroshiro> | null = null;
let initFailed: Error | null = null;

async function getKuroshiro() {
  if (initFailed) return null;
  if (!instancePromise) {
    instancePromise = (async () => {
      const kuroshiro = new Kuroshiro();
      // Resolve kuromoji package root robustly (works in serverless/monorepos).
      const require = createRequire(import.meta.url);
      let dictPath: string;
      try {
        // Try resolving kuromoji package.json first.
        const kuromojiPkg = require.resolve("kuromoji/package.json");
        const dictDir = path.dirname(kuromojiPkg);
        dictPath = path.resolve(dictDir, "dict");
      } catch {
        // Fallback: try resolving kuromoji main entry, then go up to find dict.
        try {
          const kuromojiMain = require.resolve("kuromoji");
          const dictDir = path.dirname(kuromojiMain);
          dictPath = path.resolve(dictDir, "dict");
        } catch {
          // Last resort: use process.cwd() + node_modules (may not work in serverless).
          dictPath = path.resolve(process.cwd(), "node_modules", "kuromoji", "dict");
        }
      }

      // 만약 (rsc) 경로나 잘못된 경로로 인해 dict 파일이 없으면,
      // 실제 node_modules 경로로 한 번 더 폴백한다.
      const checkFile = path.join(dictPath, "check.dat.gz");
      if (!fs.existsSync(checkFile)) {
        const altDict = path.resolve(
          process.cwd(),
          "node_modules",
          "kuromoji",
          "dict"
        );
        const altCheck = path.join(altDict, "check.dat.gz");
        if (fs.existsSync(altCheck)) {
          dictPath = altDict;
        }
      }
      // Ensure dictPath is a valid string (not number/undefined).
      if (typeof dictPath !== "string" || !dictPath) {
        throw new Error(`dictPath must be non-empty string, got ${typeof dictPath}: ${dictPath}`);
      }
      // Log for debugging (remove in production if too verbose).
      console.log("[kuroshiro] dictPath:", dictPath);
      await kuroshiro.init(
        new KuromojiAnalyzer({ dictPath } as unknown as { dictPath: string })
      );
      return kuroshiro;
    })();
  }
  try {
    return await instancePromise;
  } catch (e) {
    initFailed = e instanceof Error ? e : new Error("kuroshiro init failed");
    console.error("[kuroshiro] init failed:", initFailed.message);
    if (e instanceof Error && e.stack) {
      console.error("[kuroshiro] stack:", e.stack);
    }
    return null;
  }
}

function hasKanji(text: string) {
  return /[\u4E00-\u9FFF]/.test(text);
}

const rubyCache = new Map<string, string>();

/**
 * Convert Japanese text to HTML ruby markup with hiragana furigana.
 * - For strings without kanji, returns escaped text (no ruby).
 */
export async function toRubyHtml(text: string): Promise<string> {
  const key = text;
  const cached = rubyCache.get(key);
  if (cached) return cached;

  const escaped = escapeHtml(text);
  if (!hasKanji(text)) {
    rubyCache.set(key, escaped);
    return escaped;
  }

  try {
    const kuroshiro = await getKuroshiro();
    if (!kuroshiro) {
      rubyCache.set(key, escaped);
      return escaped;
    }
    // mode: "furigana" returns <ruby>...<rt>...</rt></ruby>
    const html = await kuroshiro.convert(text, { to: "hiragana", mode: "furigana" });
    rubyCache.set(key, String(html));
    return String(html);
  } catch (e) {
    const err = e instanceof Error ? e : new Error("kuroshiro convert failed");
    console.error("[kuroshiro] convert failed:", err.message);
    rubyCache.set(key, escaped);
    return escaped;
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

