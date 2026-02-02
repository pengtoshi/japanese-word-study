import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBarConfig } from "@/components/TopBarProvider";
import { HomeQuickReviewPanel } from "@/layouts/home/HomeQuickReviewPanel";
import { toRubyHtml } from "@/lib/kuroshiro-server";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const userId = userData.user.id;

  // 오늘 날짜 (UTC 기준, 한국 시간 고려)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  // 1. 오늘의 학습 통계
  // 오늘 푼 문제 수
  const { count: todayProblemsCount } = await supabase
    .from("practice_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart);

  // 오늘 추가한 표현 수
  const { count: todayVocabCount } = await supabase
    .from("vocab_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart);

  // 2. 최근 오답 문제 (최근 10개)
  // 모든 문제의 최신 시도 중 needs_fix인 것들 찾기
  const { data: allAttempts } = await supabase
    .from("practice_attempts")
    .select("id, problem_id, verdict, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100); // 최근 100개 시도만 확인

  // 각 문제의 최신 시도만 추출
  const latestAttemptByProblemId = new Map<
    string,
    { verdict: "perfect" | "acceptable" | "needs_fix"; created_at: string }
  >();

  for (const attempt of allAttempts ?? []) {
    const pid = String(attempt.problem_id);
    if (!latestAttemptByProblemId.has(pid)) {
      latestAttemptByProblemId.set(pid, {
        verdict: attempt.verdict as "perfect" | "acceptable" | "needs_fix",
        created_at: attempt.created_at,
      });
    }
  }

  // needs_fix인 문제들만 필터링하고 최신순 정렬
  const wrongProblemIds = Array.from(latestAttemptByProblemId.entries())
    .filter(([, attempt]) => attempt.verdict === "needs_fix")
    .sort((a, b) => new Date(b[1].created_at).getTime() - new Date(a[1].created_at).getTime())
    .slice(0, 10)
    .map(([pid]) => pid);

  // 문제 정보 가져오기
  const { data: wrongProblems } = wrongProblemIds.length
    ? await supabase
        .from("practice_problems")
        .select("id, prompt_ko, model_answer_ja, session_id, created_at")
        .in("id", wrongProblemIds)
        .eq("user_id", userId)
    : { data: [] };

  // 세션 정보 가져오기 (문제 인덱스 계산용)
  const sessionIds = [
    ...new Set((wrongProblems ?? []).map((p) => String(p.session_id))),
  ];

  // 각 세션의 문제들을 가져와서 인덱스 계산
  const sessionProblemsMap = new Map<string, Array<{ id: string; created_at: string }>>();
  for (const sessionId of sessionIds) {
    const { data: problems } = await supabase
      .from("practice_problems")
      .select("id, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    sessionProblemsMap.set(sessionId, problems ?? []);
  }

  // 오답 문제에 인덱스와 ruby HTML 추가
  const wrongProblemsWithIndex = await Promise.all(
    (wrongProblems ?? []).map(async (problem) => {
      const sessionId = String(problem.session_id);
      const problems = sessionProblemsMap.get(sessionId) ?? [];
      const index = problems.findIndex((p) => p.id === problem.id) + 1;

      return {
        id: problem.id,
        sessionId,
        index,
        promptKo: String(problem.prompt_ko),
        modelAnswerJa: String(problem.model_answer_ja),
        modelAnswerRubyHtml: await toRubyHtml(String(problem.model_answer_ja)),
        createdAt: String(problem.created_at),
      };
    })
  );

  // 3. 최근 추가한 표현 (최근 10개)
  const { data: recentVocabItems } = await supabase
    .from("vocab_items")
    .select("id, ja_surface, ko_meaning, list_id, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentVocabWithRuby = await Promise.all(
    (recentVocabItems ?? []).map(async (item) => ({
      id: String(item.id),
      listId: String(item.list_id),
      jaSurface: String(item.ja_surface),
      jaSurfaceRubyHtml: await toRubyHtml(String(item.ja_surface)),
      koMeaning: item.ko_meaning ? String(item.ko_meaning) : null,
      createdAt: String(item.created_at),
    }))
  );

  return (
    <div className="space-y-4 pb-28">
      <TopBarConfig title="홈" backHref={null} />
      <HomeQuickReviewPanel
        todayProblemsCount={todayProblemsCount ?? 0}
        todayVocabCount={todayVocabCount ?? 0}
        wrongProblems={wrongProblemsWithIndex}
        recentVocabItems={recentVocabWithRuby}
      />
    </div>
  );
}
