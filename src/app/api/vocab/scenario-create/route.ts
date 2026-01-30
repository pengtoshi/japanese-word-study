import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_JLPT_LEVEL, type JlptLevel } from "@/lib/jlpt";
import { createScenarioVocabListInDb } from "@/lib/scenario-vocab";

const BodySchema = z.object({
  scenarioPrompt: z.string().trim().min(3).max(800),
  problemCount: z.number().int().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message ?? "Invalid body",
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { data: settings } = await supabase
      .from("user_settings")
      .select("jlpt_level")
      .eq("user_id", user.id)
      .maybeSingle();
    const jlptLevel = (settings?.jlpt_level ?? DEFAULT_JLPT_LEVEL) as JlptLevel;

    const { listId, sessionId } = await createScenarioVocabListInDb({
      supabase,
      userId: user.id,
      scenarioPrompt: parsed.data.scenarioPrompt,
      problemCount: parsed.data.problemCount,
      jlptLevel,
    });

    return NextResponse.json({ ok: true, listId, sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // 대부분 OpenAI/스키마/DB 계열이라 500으로 충분
    return new NextResponse(msg, { status: 500 });
  }
}

