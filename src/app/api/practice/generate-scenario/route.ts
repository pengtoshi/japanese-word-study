import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAiModels } from "@/lib/openai-models";
import { chatJson } from "@/lib/openai-json";

const BodySchema = z.object({
  sessionId: z.uuid(),
});

// Scenario mode: keep output minimal & stable
const RawProblemSchema = z.looseObject({
  promptKo: z.string().min(1).optional(),
  prompt_ko: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  targetItemIds: z.array(z.union([z.string(), z.number()])).optional(),
  target_item_ids: z.array(z.union([z.string(), z.number()])).optional(),
  targetIds: z.array(z.union([z.string(), z.number()])).optional(),
  target_ids: z.array(z.union([z.string(), z.number()])).optional(),
  modelAnswerJa: z.string().min(1).optional(),
  model_answer_ja: z.string().min(1).optional(),
  modelAnswer: z.string().min(1).optional(),
  model_answer: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const debugRaw =
      (process.env.OPENAI_DEBUG_RAW_RESPONSE || "").toLowerCase() === "true";
    const clip = (text: string, max = 1800) =>
      text.length <= max ? text : text.slice(0, max) + "…(truncated)";

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new NextResponse("Invalid body", { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("id, list_id, problem_count, jlpt_level, scenario_prompt")
      .eq("id", parsed.data.sessionId)
      .single();

    if (sessionError || !session) {
      return new NextResponse(sessionError?.message ?? "Session not found", {
        status: 404,
      });
    }

    const scenarioPrompt = session.scenario_prompt
      ? String(session.scenario_prompt)
      : "";
    if (!scenarioPrompt) {
      return new NextResponse("이 세션은 상황별 단어장 세션이 아닙니다.", {
        status: 400,
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from("vocab_items")
      .select("id, ja_surface, ja_reading_hira, ko_meaning, memo, is_active")
      .eq("list_id", session.list_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (itemsError)
      return new NextResponse(itemsError.message, { status: 500 });
    if (!items || items.length < 1)
      return new NextResponse("단어장에 활성 표현이 없습니다.", {
        status: 400,
      });

    const { generate } = getOpenAiModels();

    const jlpt = (session.jlpt_level ?? "n3") as "n1" | "n2" | "n3" | "n4" | "n5";
    const jlptLabel = `JLPT ${jlpt.toUpperCase()}`;
    const problemCount = Math.min(Math.max(session.problem_count ?? 10, 1), 50);

    const GeneratedResponseSchema = z.object({
      problems: z.array(RawProblemSchema).min(problemCount),
    });

    const system = [
      "당신은 '상황별 단어장' 전용 일본어 작문 연습문제를 생성합니다.",
      "규칙:",
      "- 출력은 반드시 제공된 스키마를 만족하는 '유효한 JSON'이어야 합니다.",
      `- 문제는 정확히 ${problemCount}개 생성하세요.`,
      "- 각 문제는 제공된 단어(id) 중 1~3개를 선택해 자연스럽게 사용해야 합니다.",
      "- 서로 무관한 단어를 억지로 한 문장에 넣지 마세요.",
      "- 프롬프트(promptKo)는 실제로 말할 법한 한국어 문장이어야 합니다.",
      "- 모범답안(modelAnswerJa)은 자연스러운 일본어여야 하고, 선택한 표현을 반드시 포함해야 합니다.",
      `- 난이도는 ${jlptLabel} 수준을 목표로 합니다.`,
      "- IMPORTANT: target ids는 제공된 uuid를 그대로 사용해야 합니다(새로 만들면 안 됨).",
      "- 마크다운/설명/코멘트는 절대 포함하지 말고, JSON만 출력하세요.",
      '- 각 문제는 반드시 다음 키를 사용하세요: promptKo, targetItemIds, modelAnswerJa.',
      '예시 JSON: {"problems":[{"promptKo":"...","targetItemIds":["<uuid>"],"modelAnswerJa":"..."}]}',
      "",
      "상황(반드시 반영):",
      scenarioPrompt,
    ].join("\n");

    const userPrompt = JSON.stringify(
      {
        vocabItems: items.map((it) => ({
          id: it.id,
          jaSurface: it.ja_surface,
          koMeaning: it.ko_meaning,
          memo: it.memo,
        })),
      },
      null,
      2
    );

    async function run(model: string) {
      return await chatJson({
        model,
        schema: GeneratedResponseSchema,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      });
    }

    let validatedData: z.infer<typeof GeneratedResponseSchema>;
    try {
      validatedData = await run(generate.model);
    } catch (e) {
      if (generate.fallbackModel && generate.fallbackModel !== generate.model) {
        validatedData = await run(generate.fallbackModel);
      } else {
        throw e;
      }
    }

    const slice = validatedData.problems.slice(0, problemCount);

    const idSet = new Set<string>();
    for (const it of items) idSet.add(String(it.id));

    function normalizeTargetIds(raw: unknown): string[] {
      const arr = Array.isArray(raw) ? raw : [];
      const mapped = arr
        .map((v) => String(v).trim())
        .filter((v) => idSet.has(v));
      const uniq: string[] = [];
      for (const v of mapped) {
        if (!uniq.includes(v)) uniq.push(v);
        if (uniq.length >= 3) break;
      }
      return uniq;
    }

    const normalized = slice.map((p) => {
      const promptKo = p.promptKo ?? p.prompt_ko ?? p.prompt ?? "";
      const modelAnswerJa =
        p.modelAnswerJa ?? p.model_answer_ja ?? p.modelAnswer ?? p.model_answer ?? "";
      const rawTargets =
        p.targetItemIds ?? p.target_item_ids ?? p.targetIds ?? p.target_ids ?? [];
      const targetItemIds = normalizeTargetIds(rawTargets);
      return {
        promptKo: String(promptKo).trim(),
        modelAnswerJa: String(modelAnswerJa).trim(),
        targetItemIds,
      };
    });

    for (const p of normalized) {
      if (!p.promptKo || !p.modelAnswerJa || p.targetItemIds.length < 1) {
        const details = debugRaw
          ? ` details=${clip(
              JSON.stringify({
                reason: "missing fields after normalization",
                normalizedPreview: normalized.slice(0, 3),
                rawPreview: slice.slice(0, 3),
              })
            )}`
          : "";
        return new NextResponse(`OpenAI response schema mismatch.${details}`, {
          status: 502,
        });
      }
    }

    const payload = normalized.map((p) => ({
      user_id: user.id,
      session_id: session.id,
      prompt_ko: p.promptKo,
      target_item_ids: p.targetItemIds,
      model_answer_ja: p.modelAnswerJa,
      alt_answer_ja: null,
    }));

    const { error: insertError } = await supabase
      .from("practice_problems")
      .insert(payload);
    if (insertError)
      return new NextResponse(insertError.message, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(msg, { status: 500 });
  }
}

