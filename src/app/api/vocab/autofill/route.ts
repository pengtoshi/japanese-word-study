import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAiModels } from "@/lib/openai-models";
import { chatJson } from "@/lib/openai-json";

const BodySchema = z.object({
  jaSurface: z.string().trim().min(1).max(200),
});

const ResponseSchema = z.object({
  koMeaning: z.string().trim().min(1).max(400),
  jaReadingHira: z.string().trim().min(1).max(200).optional(),
});

function hasKanji(text: string) {
  return /[\u4E00-\u9FFF]/.test(text);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new NextResponse("Unauthorized", { status: 401 });

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return new NextResponse("Invalid body", { status: 400 });

    const surface = parsed.data.jaSurface;
    const needReading = hasKanji(surface);

    const { autofill } = getOpenAiModels();

    const system = [
      "You help fill a Japanese vocabulary form for a Korean learner.",
      "Return JSON only.",
      "Rules:",
      "- koMeaning: concise Korean meaning (not a full sentence).",
      needReading
        ? "- jaReadingHira: full reading in hiragana for the entire jaSurface."
        : "- Do NOT include jaReadingHira.",
      "- Keep it short and practical.",
      "- If the input is a phrase with symbols like 〜, keep them; reading should correspond naturally.",
    ].join("\n");

    const userPrompt = JSON.stringify({ jaSurface: surface, needReading });

    async function run(model: string) {
      const validated = await chatJson({
        model,
        schema: ResponseSchema,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      });

      if (!needReading) {
        return { koMeaning: validated.koMeaning };
      }
      return validated;
    }

    try {
      const result = await run(autofill.model);
      return NextResponse.json(result);
    } catch (e) {
      if (
        autofill.fallbackModel &&
        autofill.fallbackModel !== autofill.model
      ) {
        try {
          const result = await run(autofill.fallbackModel);
          return NextResponse.json(result);
        } catch (e2) {
          const msg = e2 instanceof Error ? e2.message : "OpenAI error";
          return new NextResponse(msg, { status: 502 });
        }
      }
      const msg = e instanceof Error ? e.message : "OpenAI error";
      return new NextResponse(msg, { status: 502 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(msg, { status: 500 });
  }
}

