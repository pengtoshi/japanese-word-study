import { z } from "zod";

import { getOpenAiModels } from "@/lib/openai-models";
import { chatJson } from "@/lib/openai-json";
import { jlptLabel, type JlptLevel } from "@/lib/jlpt";
import type { SupabaseClient } from "@supabase/supabase-js";

const RawScenarioProblemSchema = z.looseObject({
  promptKo: z.string().min(1).optional(),
  prompt_ko: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  modelAnswerJa: z.string().min(1).optional(),
  model_answer_ja: z.string().min(1).optional(),
  modelAnswer: z.string().min(1).optional(),
  model_answer: z.string().min(1).optional(),
});

function safeListNameFromScenario(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  const base = trimmed.length <= 30 ? trimmed : trimmed.slice(0, 30) + "…";
  return `상황: ${base}`.slice(0, 50);
}

export async function createScenarioVocabListInDb({
  supabase,
  userId,
  scenarioPrompt,
  problemCount,
  jlptLevel,
}: {
  supabase: SupabaseClient;
  userId: string;
  scenarioPrompt: string;
  problemCount: number;
  jlptLevel: JlptLevel;
}): Promise<{ listId: string; sessionId: string }> {
  const debugRaw =
    (process.env.OPENAI_DEBUG_RAW_RESPONSE || "").toLowerCase() === "true";
  const clip = (text: string, max = 1800) =>
    text.length <= max ? text : text.slice(0, max) + "…(truncated)";

  const { generate, autofill } = getOpenAiModels();

  // ----------------------------------------
  // Step 1) Generate scenario-based problems
  // ----------------------------------------
  const ScenarioProblemsSchema = z.object({
    problems: z.array(RawScenarioProblemSchema).min(problemCount),
  });

  const system1 = [
    "당신은 일본어 작문 연습용 문제를 생성합니다.",
    "규칙:",
    "- 출력은 반드시 제공된 스키마를 만족하는 '유효한 JSON'이어야 합니다.",
    `- 문제는 정확히 ${problemCount}개 생성하세요.`,
    "- 프롬프트(promptKo)는 주어진 상황에서 실제로 말할 법한 자연스러운 한국어 문장이어야 합니다.",
    "- 모범답안(modelAnswerJa)은 프롬프트에 대응하는 자연스러운 일본어(대체로 1문장, 길어도 2문장)여야 합니다.",
    `- 난이도는 ${jlptLabel(jlptLevel)} 수준을 목표로 합니다.`,
    "- 마크다운/설명/코멘트는 절대 포함하지 말고, JSON만 출력하세요.",
    '- 각 문제는 반드시 다음 키를 사용하세요: promptKo, modelAnswerJa.',
    '예시 JSON: {"problems":[{"promptKo":"...","modelAnswerJa":"..."}]}',
  ].join("\n");

  const user1 = JSON.stringify(
    {
      scenarioPrompt,
      notes: [
        "문장 길이는 너무 길지 않게(대체로 1문장, 길어도 2문장).",
        "실제 회화에서 자주 나오는 상황/말투를 우선.",
      ],
    },
    null,
    2
  );

  async function runStep1(model: string) {
    return await chatJson({
      model,
      schema: ScenarioProblemsSchema,
      messages: [
        { role: "system", content: system1 },
        { role: "user", content: user1 },
      ],
    });
  }

  let step1Data: z.infer<typeof ScenarioProblemsSchema>;
  try {
    step1Data = await runStep1(generate.model);
  } catch (e) {
    if (generate.fallbackModel && generate.fallbackModel !== generate.model) {
      step1Data = await runStep1(generate.fallbackModel);
    } else {
      throw e;
    }
  }

  const rawProblems = step1Data.problems.slice(0, problemCount);
  const problems = rawProblems.map((p) => {
    const promptKo = (p.promptKo ?? p.prompt_ko ?? p.prompt ?? "").trim();
    const modelAnswerJa = (
      p.modelAnswerJa ??
      p.model_answer_ja ??
      p.modelAnswer ??
      p.model_answer ??
      ""
    ).trim();

    return { promptKo, modelAnswerJa };
  });

  for (const p of problems) {
    if (!p.promptKo || !p.modelAnswerJa) {
      const details = debugRaw
        ? ` details=${clip(
            JSON.stringify({
              reason: "missing promptKo/modelAnswerJa after normalization",
              normalizedPreview: problems.slice(0, 3),
              rawPreview: rawProblems.slice(0, 3),
            })
          )}`
        : "";
      throw new Error(`OpenAI response schema mismatch.${details}`);
    }
  }

  // ----------------------------------------
  // Step 2) Extract vocab items + per-problem targets (by key)
  // ----------------------------------------
  const ExtractItemSchema = z.object({
    key: z.string().trim().min(1),
    jaSurface: z.string().trim().min(1).max(200),
    koMeaning: z.string().trim().min(1).max(400),
    memo: z.string().trim().max(800).optional(),
  });

  const Step2Schema = z.object({
    listName: z.string().trim().min(1).max(80),
    items: z.array(ExtractItemSchema).min(1),
    problemTargets: z
      .array(
        z.object({
          index: z.number().int().min(1).max(problemCount),
          targetItemKeys: z.array(z.string().trim().min(1)).min(1).max(3),
        })
      )
      .min(problemCount),
  });

  const system2 = [
    "당신은 주어진 연습문제(모범답안 포함)로부터 단어/표현을 추출합니다.",
    "규칙:",
    "- 출력은 반드시 제공된 스키마를 만족하는 '유효한 JSON'이어야 합니다.",
    "- listName은 가능하면 짧게(가급적 20자 이내) 작성하세요.",
    "- 단어장에 저장할 가치가 있는 단어/표현만 추출하세요(불필요한 조사/기호/중복 제외).",
    "- 각 항목은 jaSurface + koMeaning이 필수입니다.",
    "- IMPORTANT: 각 항목에 안정적인 key를 부여하세요(예: w1, w2, ...).",
    `- 각 문제(index 1..${problemCount})마다 modelAnswerJa에 실제로 등장하는 key를 1-3개 선택하세요.`,
    "- 마크다운/설명/코멘트는 절대 포함하지 말고, JSON만 출력하세요.",
    '예시: {"listName":"...","items":[{"key":"w1","jaSurface":"壁にかかった","koMeaning":"벽에 걸린"},{"key":"w2","jaSurface":"カフェ","koMeaning":"카페"}],"problemTargets":[{"index":1,"targetItemKeys":["w1"]}]}',
  ].join("\n");

  const user2 = JSON.stringify(
    {
      scenarioPrompt,
      jlptLevel,
      problems: problems.map((p, idx) => ({
        index: idx + 1,
        promptKo: p.promptKo,
        modelAnswerJa: p.modelAnswerJa,
      })),
    },
    null,
    2
  );

  async function runStep2(model: string) {
    return await chatJson({
      model,
      schema: Step2Schema,
      messages: [
        { role: "system", content: system2 },
        { role: "user", content: user2 },
      ],
    });
  }

  let step2Data: z.infer<typeof Step2Schema>;
  try {
    step2Data = await runStep2(autofill.model);
  } catch (e) {
    if (
      autofill.fallbackModel &&
      String(autofill.fallbackModel) !== String(autofill.model)
    ) {
      step2Data = await runStep2(autofill.fallbackModel);
    } else {
      throw e;
    }
  }

  // Normalize + dedupe items by jaSurface
  const keyToSurface = new Map<string, string>();
  const normalizedItems: Array<{
    key: string;
    ja_surface: string;
    ko_meaning: string;
    memo: string | null;
  }> = [];

  for (const it of step2Data.items) {
    const key = String(it.key).trim();
    const jaSurface = String(it.jaSurface).trim();
    const koMeaning = String(it.koMeaning).trim();
    const memo = it.memo ? String(it.memo).trim() : "";
    if (!key || !jaSurface || !koMeaning) continue;
    if (!keyToSurface.has(key)) keyToSurface.set(key, jaSurface);
    // Deduplicate by surface (keep first)
    if (normalizedItems.some((x) => x.ja_surface === jaSurface)) continue;

    normalizedItems.push({
      key,
      ja_surface: jaSurface,
      ko_meaning: koMeaning,
      memo: memo.length > 0 ? memo : null,
    });
  }

  if (normalizedItems.length < 1) {
    throw new Error("저장할 단어를 만들지 못했어요.");
  }

  const listName = (
    step2Data.listName && step2Data.listName.trim().length > 0
      ? step2Data.listName.trim()
      : safeListNameFromScenario(scenarioPrompt)
  )
    .replace(/\s+/g, " ")
    .slice(0, 50);

  // Ensure we have targets for each problem index, and all keys exist
  const targetsByIndex = new Map<number, string[]>();
  for (const t of step2Data.problemTargets) {
    const idx = Number(t.index);
    if (!Number.isFinite(idx) || idx < 1 || idx > problemCount) continue;
    const filtered = (t.targetItemKeys ?? [])
      .map((k) => String(k).trim())
      .filter((k) => keyToSurface.has(k));
    const uniq: string[] = [];
    for (const k of filtered) {
      if (!uniq.includes(k)) uniq.push(k);
      if (uniq.length >= 3) break;
    }
    if (uniq.length > 0 && !targetsByIndex.has(idx)) targetsByIndex.set(idx, uniq);
  }

  const fallbackKey = normalizedItems[0]?.key;
  for (let idx = 1; idx <= problemCount; idx++) {
    if (!targetsByIndex.has(idx) && fallbackKey) targetsByIndex.set(idx, [fallbackKey]);
  }

  // ----------------------------------------
  // DB Insert (best-effort cleanup on failure)
  // ----------------------------------------
  let createdListId: string | null = null;
  try {
    const { data: listRow, error: listErr } = await supabase
      .from("vocab_lists")
      .insert({
        user_id: userId,
        name: listName,
        kind: "scenario",
        scenario_prompt: scenarioPrompt,
      })
      .select("id")
      .single();
    if (listErr || !listRow) throw new Error(listErr?.message ?? "단어장을 만들지 못했어요.");
    createdListId = String(listRow.id);

    // Limit safeguard (matches per-list cap of 100)
    const itemsToInsert = normalizedItems.slice(0, 100).map((it) => ({
      user_id: userId,
      list_id: createdListId,
      ja_surface: it.ja_surface,
      // 최종 목표: DB에 후리가나 저장하지 않음 (UI에서 kuroshiro로 표시)
      ja_reading_hira: null,
      ko_meaning: it.ko_meaning,
      memo: it.memo,
      is_active: true,
    }));

    const { error: itemsErr } = await supabase.from("vocab_items").insert(itemsToInsert);
    if (itemsErr) throw new Error(itemsErr.message);

    // Reload inserted items to map surface -> id
    const surfaces = Array.from(new Set(itemsToInsert.map((x) => x.ja_surface)));
    const { data: insertedItems, error: selectItemsErr } = await supabase
      .from("vocab_items")
      .select("id, ja_surface")
      .eq("list_id", createdListId)
      .eq("user_id", userId)
      .in("ja_surface", surfaces);
    if (selectItemsErr) throw new Error(selectItemsErr.message);

    const idBySurface = new Map<string, string>();
    for (const it of insertedItems ?? []) {
      idBySurface.set(String(it.ja_surface), String(it.id));
    }

    // Create practice session with user-selected problem count
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: userId,
        list_id: createdListId,
        problem_count: problemCount,
        jlpt_level: jlptLevel,
        scenario_prompt: scenarioPrompt,
      })
      .select("id")
      .single();
    if (sessionErr || !sessionRow)
      throw new Error(sessionErr?.message ?? "세션을 만들지 못했어요.");

    const sessionId = String(sessionRow.id);

    const problemsPayload = problems.map((p, idx) => {
      const index = idx + 1;
      const keys = targetsByIndex.get(index) ?? (fallbackKey ? [fallbackKey] : []);
      const targetItemIds = keys
        .map((k) => keyToSurface.get(k))
        .filter(Boolean)
        .map((surface) => idBySurface.get(String(surface)))
        .filter(Boolean) as string[];
      const uniq: string[] = [];
      for (const id of targetItemIds) {
        if (!uniq.includes(id)) uniq.push(id);
        if (uniq.length >= 3) break;
      }

      return {
        user_id: userId,
        session_id: sessionId,
        prompt_ko: p.promptKo,
        target_item_ids: uniq.length > 0 ? uniq : [],
        model_answer_ja: p.modelAnswerJa,
        alt_answer_ja: null,
      };
    });

    for (const pr of problemsPayload) {
      if (!pr.target_item_ids || pr.target_item_ids.length < 1) {
        const details = debugRaw
          ? ` details=${clip(
              JSON.stringify({
                reason: "empty target_item_ids after mapping",
                keyToSurfacePreview: Array.from(keyToSurface.entries()).slice(0, 5),
                insertedItemsPreview: (insertedItems ?? []).slice(0, 5),
                problemsPreview: problemsPayload.slice(0, 2),
              })
            )}`
          : "";
        throw new Error(`단어 매핑 실패: 문제가 참조할 단어를 찾지 못했어요.${details}`);
      }
    }

    const { error: insertProblemsErr } = await supabase
      .from("practice_problems")
      .insert(problemsPayload);
    if (insertProblemsErr) throw new Error(insertProblemsErr.message);

    return { listId: createdListId, sessionId };
  } catch (e) {
    if (createdListId) {
      await supabase
        .from("vocab_lists")
        .delete()
        .eq("id", createdListId)
        .eq("user_id", userId);
    }
    throw e;
  }
}

