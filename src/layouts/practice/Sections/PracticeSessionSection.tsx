import { Alert } from "@/components/ui/Alert";
import { safeDecodeURIComponent } from "@/utils/format";
import { toRubyHtml } from "@/lib/kuroshiro-server";

import { PracticeManualGradeForm } from "@/layouts/practice/Forms/PracticeManualGradeForm";
import { PracticeSessionEmptySection } from "@/layouts/practice/Sections/PracticeSessionEmptySection";
import {
  PracticeSessionHeaderSection,
} from "@/layouts/practice/Sections/PracticeSessionHeaderSection";
import { PracticeSessionPromptSection } from "@/layouts/practice/Sections/PracticeSessionPromptSection";
import {
  PracticeSessionResultSection,
  type PracticeSessionResultData,
} from "@/layouts/practice/Sections/PracticeSessionResultSection";
import { PracticeAddVocabFab } from "@/layouts/practice/Sections/PracticeAddVocabFab";
import { createVocabItemToSelectedListAction } from "@/layouts/vocab/actions";

type ProblemRow = {
  id: string;
  prompt_ko: string;
  model_answer_ja: string;
  alt_answer_ja: string | null;
};

type AttemptRow = {
  id: string;
  problem_id: string;
  verdict: "perfect" | "acceptable" | "needs_fix";
  feedback: string | null;
  user_answer_ja: string;
  created_at: string;
};

export async function PracticeSessionSection({
  sessionId,
  errorParam,
  problemsErrorMessage,
  problems,
  attempts,
  searchParams,
  resetAction,
}: {
  sessionId: string;
  errorParam?: string;
  problemsErrorMessage?: string | null;
  problems: ProblemRow[];
  attempts: AttemptRow[];
  searchParams: { i?: string; mode?: string; redo?: string };
  resetAction: (formData: FormData) => void | Promise<void>;
}) {
  const { i, mode, redo } = searchParams;

  const total = problems.length;
  const parsedIndex = i ? Number(i) : NaN;

  const latestAttemptByProblemId = new Map<string, AttemptRow>();
  for (const a of attempts ?? []) {
    const pid = String(a.problem_id);
    if (!latestAttemptByProblemId.has(pid)) latestAttemptByProblemId.set(pid, a);
  }

  const wrongIndices = problems
    .map((p, idx) => ({
      n: idx + 1,
      verdict: latestAttemptByProblemId.get(p.id)?.verdict,
    }))
    .filter((x) => x.verdict === "needs_fix")
    .map((x) => x.n);

  const isWrongMode = mode === "wrong";
  const effectiveIndices =
    isWrongMode && wrongIndices.length > 0 ? wrongIndices : null;

  const answeredCount = total
    ? problems.reduce(
        (acc, p) => acc + (latestAttemptByProblemId.has(p.id) ? 1 : 0),
        0
      )
    : 0;

  const defaultIndex = (() => {
    if (problems.length === 0) return 1;
    const firstUnanswered = problems.findIndex(
      (p) => !latestAttemptByProblemId.has(p.id)
    );
    return firstUnanswered >= 0 ? firstUnanswered + 1 : 1;
  })();

  const currentIndex =
    Number.isFinite(parsedIndex) && parsedIndex >= 1 && parsedIndex <= total
      ? Math.floor(parsedIndex)
      : defaultIndex;

  const resolvedIndex =
    effectiveIndices && effectiveIndices.length > 0
      ? effectiveIndices.includes(currentIndex)
        ? currentIndex
        : effectiveIndices[0]!
      : currentIndex;

  const currentProblem = problems[resolvedIndex - 1] ?? null;
  const lastAttempt = currentProblem
    ? latestAttemptByProblemId.get(currentProblem.id) ?? null
    : null;

  const isRedoMode = redo === "1";
  const shouldShowForm = !lastAttempt || isRedoMode || isWrongMode;
  const shouldShowResult = !!lastAttempt && !isRedoMode && !isWrongMode;

  const nextIndex = (() => {
    if (effectiveIndices && effectiveIndices.length > 0) {
      const pos = effectiveIndices.indexOf(resolvedIndex);
      return pos >= 0 && pos < effectiveIndices.length - 1
        ? effectiveIndices[pos + 1]!
        : effectiveIndices[pos]!;
    }
    return resolvedIndex < total ? resolvedIndex + 1 : total;
  })();

  const nextUnansweredIndex = (() => {
    if (problems.length === 0) return 1;
    for (let idx = currentIndex; idx < problems.length; idx++) {
      if (!latestAttemptByProblemId.has(problems[idx]!.id)) return idx + 1;
    }
    for (let idx = 0; idx < currentIndex - 1; idx++) {
      if (!latestAttemptByProblemId.has(problems[idx]!.id)) return idx + 1;
    }
    return Math.min(currentIndex + 1, problems.length);
  })();

  const nextHref = `/app/practice/${sessionId}?i=${
    isWrongMode ? nextIndex : nextUnansweredIndex
  }${isWrongMode ? "&mode=wrong" : ""}`;
  const redoHref = `/app/practice/${sessionId}?i=${resolvedIndex}&redo=1${
    isWrongMode ? "&mode=wrong" : ""
  }`;

  const quickNavItems = (
    effectiveIndices ?? problems.map((_, idx) => idx + 1)
  ).map((n) => {
    const p = problems[n - 1]!;
    const attempt = latestAttemptByProblemId.get(p.id);
    const toneClassName =
      attempt?.verdict === "perfect"
        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
        : attempt?.verdict === "acceptable"
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : attempt?.verdict === "needs_fix"
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-white border-zinc-300 text-zinc-900";

    return {
      id: p.id,
      n,
      href: `/app/practice/${sessionId}?i=${n}${isWrongMode ? "&mode=wrong" : ""}`,
      isCurrent: n === resolvedIndex,
      toneClassName,
    };
  });

  const resultData: PracticeSessionResultData | null = lastAttempt
    ? { verdict: lastAttempt.verdict, userAnswerJa: lastAttempt.user_answer_ja }
    : null;

  const modelAnswerRubyHtml = currentProblem
    ? await toRubyHtml(currentProblem.model_answer_ja)
    : null;
  const altAnswerRubyHtml =
    currentProblem?.alt_answer_ja ? await toRubyHtml(currentProblem.alt_answer_ja) : null;
  const userAnswerRubyHtml =
    shouldShowResult && resultData ? await toRubyHtml(resultData.userAnswerJa) : null;

  const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      {errorParam ? (
        <Alert tone="danger">{safeDecodeURIComponent(errorParam)}</Alert>
      ) : null}
      {problemsErrorMessage ? (
        <Alert tone="danger">
          문제를 불러오지 못했어요: {problemsErrorMessage}
        </Alert>
      ) : null}

      {!currentProblem ? (
        <PracticeSessionEmptySection />
      ) : (
        <>
          <PracticeSessionHeaderSection
            sessionId={sessionId}
            isWrongMode={isWrongMode}
            wrongCount={wrongIndices.length}
            total={total}
            answeredCount={answeredCount}
            quickNavItems={quickNavItems}
            resetAction={resetAction}
          />

          <PracticeSessionPromptSection promptKo={currentProblem.prompt_ko} />

          {shouldShowForm ? (
            <PracticeManualGradeForm
              key={currentProblem.id}
              apiBaseUrl={apiBaseUrl}
              problemId={currentProblem.id}
              nextHref={nextHref}
              modelAnswerJa={currentProblem.model_answer_ja}
              modelAnswerRubyHtml={modelAnswerRubyHtml}
              altAnswerJa={currentProblem.alt_answer_ja}
              altAnswerRubyHtml={altAnswerRubyHtml}
            />
          ) : null}

          {shouldShowResult && resultData ? (
            <PracticeSessionResultSection
              result={resultData}
              modelAnswerJa={currentProblem.model_answer_ja}
              modelAnswerRubyHtml={modelAnswerRubyHtml}
              altAnswerJa={currentProblem.alt_answer_ja}
              altAnswerRubyHtml={altAnswerRubyHtml}
              userAnswerRubyHtml={userAnswerRubyHtml}
              nextHref={nextHref}
              nextLabel={isWrongMode ? "다음 오답" : "다음 문제로"}
              redoHref={redoHref}
            />
          ) : null}

          <PracticeAddVocabFab createAction={createVocabItemToSelectedListAction} />
        </>
      )}
    </>
  );
}

