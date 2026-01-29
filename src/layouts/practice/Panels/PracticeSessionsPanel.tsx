import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PracticeSessionsList,
  type PracticeSessionCard,
} from "./PracticeSessionsPanel.elements";

async function deletePracticeSessionsAction(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const ids = formData
    .getAll("sessionId")
    .map((v) => String(v))
    .filter(Boolean);

  if (ids.length === 0) {
    redirect("/app/practice");
  }

  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/app/practice?error=${encodeURIComponent(
        error.message ?? "연습을 삭제하지 못했어요."
      )}`
    );
  }

  // NOTE: 페이지가 동적 렌더라 refresh로도 되지만, 기존 동작 유지 차원에서 redirect
  redirect("/app/practice");
}

export async function PracticeSessionsPanel() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const userId = userData.user.id;

  const { data: lists } = await supabase
    .from("vocab_lists")
    .select("id, name")
    .order("created_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("id, list_id, created_at, problem_count, jlpt_level")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const listNameById = new Map<string, string>();
  for (const l of lists ?? []) listNameById.set(String(l.id), String(l.name));

  const sessionCards: PracticeSessionCard[] = await Promise.all(
    (sessions ?? []).map(async (s) => {
      const { count: problemsCount } = await supabase
        .from("practice_problems")
        .select("id", { count: "exact", head: true })
        .eq("session_id", s.id);

      const { data: problemRows } = await supabase
        .from("practice_problems")
        .select("id")
        .eq("session_id", s.id)
        .order("created_at", { ascending: true });

      const problemIds = (problemRows ?? []).map((p) => p.id);

      const { data: attempts } = problemIds.length
        ? await supabase
            .from("practice_attempts")
            .select("id, problem_id, verdict, created_at")
            .in("problem_id", problemIds)
            .order("created_at", { ascending: false })
        : { data: [] as Array<{ problem_id: string; verdict: string }> };

      const latestAttemptByProblemId = new Map<
        string,
        { problem_id: string; verdict: "perfect" | "acceptable" | "needs_fix" }
      >();
      for (const a of attempts ?? []) {
        const v = a.verdict as "perfect" | "acceptable" | "needs_fix";
        if (!latestAttemptByProblemId.has(a.problem_id)) {
          latestAttemptByProblemId.set(a.problem_id, {
            problem_id: a.problem_id,
            verdict: v,
          });
        }
      }

      const total = (s.problem_count ?? 10) as number;
      const answeredCount = problemIds.reduce(
        (acc, pid) => acc + (latestAttemptByProblemId.has(pid) ? 1 : 0),
        0
      );

      const wrongIndices: number[] = [];
      problemIds.forEach((pid, idx) => {
        const verdict = latestAttemptByProblemId.get(pid)?.verdict;
        if (verdict === "needs_fix") wrongIndices.push(idx + 1);
      });

      const firstWrong = wrongIndices[0] ?? null;

      return {
        id: String(s.id),
        listName: listNameById.get(String(s.list_id)) ?? "단어장",
        createdAt: String(s.created_at),
        jlptLevel: String(s.jlpt_level ?? "n3"),
        total,
        problemsCount: problemsCount ?? 0,
        answeredCount,
        wrongCount: wrongIndices.length,
        firstWrong,
      };
    })
  );

  return (
    <PracticeSessionsList
      sessions={sessionCards}
      deleteManyAction={deletePracticeSessionsAction}
    />
  );
}

