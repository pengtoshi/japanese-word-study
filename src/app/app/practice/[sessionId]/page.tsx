import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBarConfig } from "@/components/TopBarProvider";

import { PracticeSessionSection } from "@/layouts/practice/Sections/PracticeSessionSection";

async function resetSessionAction(sessionId: string) {
  "use server";

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: problems } = await supabase
    .from("practice_problems")
    .select("id")
    .eq("session_id", sessionId);

  const problemIds = (problems ?? []).map((p) => String(p.id)).filter(Boolean);
  if (problemIds.length > 0) {
    await supabase
      .from("practice_attempts")
      .delete()
      .eq("user_id", user.id)
      .in("problem_id", problemIds);
  }

  revalidatePath(`/app/practice/${sessionId}`);
  revalidatePath(`/app/practice/${sessionId}/summary`);
  revalidatePath("/app/practice");
  redirect(`/app/practice/${sessionId}`);
}

export default async function PracticeSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    error?: string;
    i?: string;
    mode?: string;
    redo?: string;
  }>;
}) {
  const { sessionId } = await params;
  const { error: errorParam, i, mode, redo } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: problems, error: problemsError } = await supabase
    .from("practice_problems")
    .select("id, prompt_ko, model_answer_ja, alt_answer_ja, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const problemIds = (problems ?? []).map((p) => p.id);
  const { data: attempts } = problemIds.length
    ? await supabase
        .from("practice_attempts")
        .select("id, problem_id, verdict, feedback, user_answer_ja, created_at")
        .in("problem_id", problemIds)
        .order("created_at", { ascending: false })
    : {
        data: [] as Array<{
          id: string;
          problem_id: string;
          verdict: "perfect" | "acceptable" | "needs_fix";
          feedback: string | null;
          user_answer_ja: string;
          created_at: string;
        }>,
      };

  return (
    <div className="space-y-4">
      <TopBarConfig title="연습" backHref="/app/practice" />
      <PracticeSessionSection
        sessionId={sessionId}
        errorParam={errorParam}
        problemsErrorMessage={problemsError?.message ?? null}
        problems={(problems ?? []).map((p) => ({
          id: String(p.id),
          prompt_ko: String(p.prompt_ko),
          model_answer_ja: String(p.model_answer_ja),
          alt_answer_ja: p.alt_answer_ja ? String(p.alt_answer_ja) : null,
        }))}
        attempts={(attempts ?? []).map((a) => ({
          id: String(a.id),
          problem_id: String(a.problem_id),
          verdict: a.verdict,
          feedback: a.feedback ? String(a.feedback) : null,
          user_answer_ja: String(a.user_answer_ja),
          created_at: String(a.created_at),
        }))}
        searchParams={{ i, mode, redo }}
        resetAction={resetSessionAction.bind(null, sessionId)}
      />
    </div>
  );
}
