import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TopBarConfig } from "@/components/TopBarProvider";
import { VocabItemExamplesPanel } from "@/layouts/vocab/Panels/VocabItemExamplesPanel";
import { toRubyHtml } from "@/lib/kuroshiro-server";

export default async function VocabItemExamplesPage({
  params,
}: {
  params: Promise<{ listId: string; itemId: string }>;
}) {
  const { listId, itemId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const userId = userData.user.id;

  // Verify vocab item exists and belongs to user
  const { data: vocabItem, error: vocabError } = await supabase
    .from("vocab_items")
    .select("id, ja_surface, ko_meaning, list_id")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (vocabError || !vocabItem) {
    redirect(`/app/vocab/${listId}?error=${encodeURIComponent("표현을 찾을 수 없어요.")}`);
  }

  if (String(vocabItem.list_id) !== listId) {
    redirect(`/app/vocab/${listId}?error=${encodeURIComponent("잘못된 단어장입니다.")}`);
  }

  // Find all practice problems that use this vocab item
  const { data: problems, error: problemsError } = await supabase
    .from("practice_problems")
    .select("id, prompt_ko, model_answer_ja, alt_answer_ja, session_id, created_at")
    .eq("user_id", userId)
    .contains("target_item_ids", [itemId])
    .order("created_at", { ascending: false });

  if (problemsError) {
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(
        problemsError.message ?? "예문을 불러오지 못했어요."
      )}`
    );
  }

  const problemIds = (problems ?? []).map((p) => p.id);

  // Get attempts for these problems
  const { data: attempts } = problemIds.length
    ? await supabase
        .from("practice_attempts")
        .select("id, problem_id, verdict, user_answer_ja, created_at")
        .in("problem_id", problemIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Map latest attempt per problem
  const latestAttemptByProblemId = new Map<
    string,
    {
      verdict: "perfect" | "acceptable" | "needs_fix";
      user_answer_ja: string;
      created_at: string;
    }
  >();

  for (const a of attempts ?? []) {
    const pid = String(a.problem_id);
    if (!latestAttemptByProblemId.has(pid)) {
      latestAttemptByProblemId.set(pid, {
        verdict: a.verdict as "perfect" | "acceptable" | "needs_fix",
        user_answer_ja: a.user_answer_ja,
        created_at: a.created_at,
      });
    }
  }

  // Map all problems with attempt info (no filtering - done on client)
  const allProblems = (problems ?? []).map((p) => ({
    ...p,
    hasAttempt: latestAttemptByProblemId.has(p.id),
    latestAttempt: latestAttemptByProblemId.get(p.id) ?? null,
  }));

  // Generate ruby HTML for Japanese text
  const problemsWithRuby = await Promise.all(
    allProblems.map(async (p) => ({
      ...p,
      model_answer_ruby_html: await toRubyHtml(p.model_answer_ja),
      alt_answer_ruby_html: p.alt_answer_ja ? await toRubyHtml(p.alt_answer_ja) : null,
      user_answer_ruby_html: p.latestAttempt
        ? await toRubyHtml(p.latestAttempt.user_answer_ja)
        : null,
    }))
  );

  const vocabItemRubyHtml = await toRubyHtml(vocabItem.ja_surface);

  return (
    <div className="space-y-4 pb-28">
      <TopBarConfig
        title={vocabItem.ja_surface}
        backHref={`/app/vocab/${listId}`}
      />

      <Card>
        <div className="space-y-2">
          <div
            className="text-lg font-semibold [&_ruby]:ruby [&_rt]:text-xs [&_rt]:text-(--muted)"
            dangerouslySetInnerHTML={{ __html: vocabItemRubyHtml }}
          />
          {vocabItem.ko_meaning && (
            <div className="text-sm text-(--muted)">{vocabItem.ko_meaning}</div>
          )}
        </div>
      </Card>

      <VocabItemExamplesPanel
        problems={problemsWithRuby}
        totalCount={problems?.length ?? 0}
        learnedCount={allProblems.filter((p) => p.hasAttempt).length}
      />
    </div>
  );
}
