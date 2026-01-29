import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAiModels } from "@/lib/openai-models";
import { chatJson } from "@/lib/openai-json";

const BodySchema = z.object({
  sessionId: z.uuid(),
});

// NOTE: LLM outputs are not always stable (camelCase vs snake_case, ids vs surfaces, etc).
// We accept a wider shape here, then normalize/validate before insert.
const RawProblemSchema = z.looseObject({
  promptKo: z.string().min(1).optional(),
  prompt_ko: z.string().min(1).optional(),
  // common alternative keys from LLMs
  prompt: z.string().min(1).optional(),
  targetItemIds: z.array(z.union([z.string(), z.number()])).optional(),
  target_item_ids: z.array(z.union([z.string(), z.number()])).optional(),
  targetIds: z.array(z.union([z.string(), z.number()])).optional(),
  target_ids: z.array(z.union([z.string(), z.number()])).optional(),
  modelAnswerJa: z.string().min(1).optional(),
  model_answer_ja: z.string().min(1).optional(),
  modelAnswer: z.string().min(1).optional(),
  model_answer: z.string().min(1).optional(),
  altAnswerJa: z.string().min(1).optional(),
  alt_answer_ja: z.string().min(1).optional(),
  altAnswer: z.string().min(1).optional(),
  alt_answer: z.string().min(1).optional(),
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
      .select("id, list_id, problem_count, jlpt_level")
      .eq("id", parsed.data.sessionId)
      .single();

    if (sessionError || !session) {
      return new NextResponse(sessionError?.message ?? "Session not found", {
        status: 404,
      });
    }

    // Load active vocab items for the list
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
      "You generate Korean prompts for Japanese writing practice.",
      "Rules:",
      "- Output MUST be valid JSON matching the provided schema.",
      `- Create exactly ${problemCount} problems.`,
      "- Each problem must select 1-3 target item IDs from the provided list.",
      "- Do NOT force unrelated items into the same sentence; keep it natural and realistic.",
      "- Prompts should be natural Korean sentences one might actually say.",
      "- Model answers should be natural Japanese that includes the chosen target expressions.",
      `- Target difficulty: ${jlptLabel}. Keep grammar/vocabulary/naturalness appropriate for that level.`,
      "- IMPORTANT: For target ids, use the provided 'id' strings exactly (UUIDs). Do not invent new ids.",
      '- Use these exact JSON keys per problem: promptKo, targetItemIds, modelAnswerJa, altAnswerJa(optional).',
      'Example JSON: {"problems":[{"promptKo":"...","targetItemIds":["<uuid>"],"modelAnswerJa":"...","altAnswerJa":"..."}]}',
    ].join("\n");

    const userPrompt = JSON.stringify(
      {
        vocabItems: items.map((it) => ({
          id: it.id,
          jaSurface: it.ja_surface,
          jaReadingHira: it.ja_reading_hira,
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
        try {
          validatedData = await run(generate.fallbackModel);
        } catch {
          const msg = e instanceof Error ? e.message : "OpenAI error";
          return new NextResponse(msg, { status: 502 });
        }
      } else {
        const msg = e instanceof Error ? e.message : "OpenAI error";
        return new NextResponse(msg, { status: 502 });
      }
    }

    // Normalize to the exact count we want.
    const slice = validatedData.problems.slice(0, problemCount);

    const idBySurface = new Map<string, string>();
    const idSet = new Set<string>();
    for (const it of items) {
      idSet.add(it.id);
      idBySurface.set(it.ja_surface, it.id);
    }

    function normalizeTargetIds(raw: unknown): string[] {
      const arr = Array.isArray(raw) ? raw : [];
      const mapped = arr
        .map((v) => String(v).trim())
        .map((v) => (idSet.has(v) ? v : idBySurface.get(v) ?? v))
        .filter((v) => idSet.has(v));

      // unique, max 3
      const uniq: string[] = [];
      for (const v of mapped) {
        if (!uniq.includes(v)) uniq.push(v);
        if (uniq.length >= 3) break;
      }
      return uniq;
    }

    function pickFallbackTargetIds(): string[] {
      const ids = Array.from(idSet);
      const first = ids[0];
      return first ? [first] : [];
    }

    const normalized = slice.map((p) => {
      const promptKo = p.promptKo ?? p.prompt_ko ?? p.prompt ?? "";
      const modelAnswerJa =
        p.modelAnswerJa ?? p.model_answer_ja ?? p.modelAnswer ?? p.model_answer ?? "";
      const altAnswerJa =
        p.altAnswerJa ?? p.alt_answer_ja ?? p.altAnswer ?? p.alt_answer ?? undefined;
      const rawTargets =
        p.targetItemIds ?? p.target_item_ids ?? p.targetIds ?? p.target_ids ?? [];
      const targetItemIds = normalizeTargetIds(rawTargets);

      return {
        promptKo: String(promptKo).trim(),
        modelAnswerJa: String(modelAnswerJa).trim(),
        altAnswerJa: altAnswerJa ? String(altAnswerJa).trim() : undefined,
        targetItemIds:
          targetItemIds.length > 0 ? targetItemIds : pickFallbackTargetIds(),
      };
    });

    // Final sanity check (avoid DB errors + preserve UX)
    for (const p of normalized) {
      if (!p.promptKo || !p.modelAnswerJa) {
        const details = debugRaw
          ? ` details=${clip(
              JSON.stringify({
                reason: "missing promptKo/modelAnswerJa after normalization",
                normalizedPreview: normalized.slice(0, 3),
                rawPreview: slice.slice(0, 3),
              })
            )}`
          : "";
        return new NextResponse(`OpenAI response schema mismatch.${details}`, {
          status: 502,
        });
      }
      if (!p.targetItemIds || p.targetItemIds.length < 1) {
        const details = debugRaw
          ? ` details=${clip(
              JSON.stringify({
                reason: "missing targetItemIds after normalization",
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

    // Insert problems
    const payload = normalized.map((p) => ({
      user_id: user.id,
      session_id: session.id,
      prompt_ko: p.promptKo,
      target_item_ids: p.targetItemIds,
      model_answer_ja: p.modelAnswerJa,
      alt_answer_ja: p.altAnswerJa ?? null,
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
