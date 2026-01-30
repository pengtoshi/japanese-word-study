import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBarConfig } from "@/components/TopBarProvider";
import { PracticeSummaryHeaderSection } from "@/layouts/practice/Sections/PracticeSummaryHeaderSection";
import { PracticeSummaryErrorSection } from "@/layouts/practice/Sections/PracticeSummaryErrorSection";
import { toRubyHtml } from "@/lib/kuroshiro-server";
import {
  PracticeSummaryListPanel,
  type PracticeSummaryAttemptRow,
  type PracticeSummaryProblemRow,
} from "@/layouts/practice/Panels/PracticeSummaryListPanel";

type Verdict = "perfect" | "acceptable" | "needs_fix";

type AttemptRow = {
  id: string;
  problem_id: string;
  verdict: Verdict;
  feedback: string | null;
  user_answer_ja: string;
  created_at: string;
};

export default async function PracticeSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: problems, error: problemsError } = await supabase
    .from("practice_problems")
    .select("id, prompt_ko, model_answer_ja, alt_answer_ja, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (problemsError) {
    return (
      <div className="space-y-4">
        <TopBarConfig title="세션 요약" backHref="/app/practice" />
        <PracticeSummaryErrorSection message={problemsError.message} />
      </div>
    );
  }

  const problemRows: PracticeSummaryProblemRow[] = await Promise.all(
    (problems ?? []).map(async (p) => {
      const model = String(p.model_answer_ja);
      return {
        id: String(p.id),
        promptKo: String(p.prompt_ko),
        modelAnswerJa: model,
        modelAnswerRubyHtml: await toRubyHtml(model),
      };
    })
  );

  const problemIds = problemRows.map((p) => p.id);
  const { data: attempts } = problemIds.length
    ? await supabase
        .from("practice_attempts")
        .select("id, problem_id, verdict, feedback, user_answer_ja, created_at")
        .in("problem_id", problemIds)
        .order("created_at", { ascending: false })
    : {
        data: [] as AttemptRow[],
      };

  const latestAttemptByProblemId = new Map<string, PracticeSummaryAttemptRow>();
  for (const a of attempts ?? []) {
    const pid = String(a.problem_id);
    if (!latestAttemptByProblemId.has(pid)) {
      latestAttemptByProblemId.set(pid, {
        problemId: pid,
        verdict: a.verdict,
      });
    }
  }

  const wrongIndices: number[] = [];
  problemRows.forEach((p, idx) => {
    const verdict = latestAttemptByProblemId.get(p.id)?.verdict;
    if (verdict === "needs_fix") wrongIndices.push(idx + 1);
  });
  const firstWrong = wrongIndices[0] ?? null;

  return (
    <div className="space-y-4">
      <TopBarConfig title="세션 요약" backHref="/app/practice" />
      <PracticeSummaryHeaderSection sessionId={sessionId} firstWrong={firstWrong} />
      <PracticeSummaryListPanel
        sessionId={sessionId}
        problems={problemRows}
        latestAttemptByProblemId={latestAttemptByProblemId}
      />
    </div>
  );
}
