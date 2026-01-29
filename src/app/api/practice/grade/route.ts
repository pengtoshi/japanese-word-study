import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  problemId: z.string().uuid(),
  userAnswerJa: z.string().min(1).max(2000),
  verdict: z.enum(["perfect", "acceptable", "needs_fix"]),
});

type Verdict = "perfect" | "acceptable" | "needs_fix";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success)
      return new NextResponse("Invalid body", { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { data: problem, error: problemError } = await supabase
      .from("practice_problems")
      .select("id")
      .eq("id", parsed.data.problemId)
      .single();

    if (problemError || !problem) {
      return new NextResponse(problemError?.message ?? "Problem not found", {
        status: 404,
      });
    }

    const verdict: Verdict = parsed.data.verdict;
    const feedback: string | null = null;

    const { error: insertError } = await supabase
      .from("practice_attempts")
      .insert({
        user_id: user.id,
        problem_id: parsed.data.problemId,
        user_answer_ja: parsed.data.userAnswerJa,
        verdict,
        feedback,
      });

    if (insertError)
      return new NextResponse(insertError.message, { status: 500 });

    return NextResponse.json({ ok: true, verdict });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(msg, { status: 500 });
  }
}
