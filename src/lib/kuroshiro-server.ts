import "server-only";

import path from "node:path";

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

let instancePromise: Promise<Kuroshiro> | null = null;

async function getKuroshiro() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const kuroshiro = new Kuroshiro();
      // kuromoji dict lives in node_modules/kuromoji/dict
      const dictPath = path.join(process.cwd(), "node_modules", "kuromoji", "dict");
      await kuroshiro.init(new KuromojiAnalyzer({ dictPath } as unknown as { dictPath: string }));
      return kuroshiro;
    })();
  }
  return await instancePromise;
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

  const kuroshiro = await getKuroshiro();
  // mode: "furigana" returns <ruby>...<rt>...</rt></ruby>
  const html = await kuroshiro.convert(text, { to: "hiragana", mode: "furigana" });
  // Kuroshiro already outputs HTML; cache as-is
  rubyCache.set(key, String(html));
  return String(html);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

