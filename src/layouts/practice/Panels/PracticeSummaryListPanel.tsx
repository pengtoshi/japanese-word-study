import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Verdict = "perfect" | "acceptable" | "needs_fix";

export type PracticeSummaryProblemRow = {
  id: string;
  promptKo: string;
  modelAnswerJa: string;
};

export type PracticeSummaryAttemptRow = {
  problemId: string;
  verdict: Verdict;
};

function verdictToBadge(verdict: Verdict) {
  if (verdict === "needs_fix")
    return { variant: "danger" as const, label: "오답" };
  return { variant: "success" as const, label: "정답" };
}

export function PracticeSummaryListPanel({
  sessionId,
  problems,
  latestAttemptByProblemId,
}: {
  sessionId: string;
  problems: PracticeSummaryProblemRow[];
  latestAttemptByProblemId: Map<string, PracticeSummaryAttemptRow>;
}) {
  return (
    <Card className="mt-4">
      <div className="text-base font-semibold">10문제 요약</div>
      <div className="mt-3 space-y-2">
        {problems.map((p, idx) => {
          const n = idx + 1;
          const attempt = latestAttemptByProblemId.get(p.id) ?? null;
          const verdict = attempt?.verdict ?? null;

          const badge =
            verdict === "perfect"
              ? verdictToBadge("perfect")
              : verdict === "acceptable"
                ? verdictToBadge("acceptable")
                : verdict === "needs_fix"
                  ? verdictToBadge("needs_fix")
                  : null;

          return (
            <Link
              key={p.id}
              href={`/app/practice/${sessionId}?i=${n}`}
              className="block rounded-2xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">문제 {n}</div>
                {badge ? (
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                ) : (
                  <Badge>미풀이</Badge>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="line-clamp-2 whitespace-pre-wrap text-sm text-zinc-700">
                  {p.promptKo}
                </div>
                <div className="line-clamp-2 whitespace-pre-wrap text-sm text-zinc-600">
                  {p.modelAnswerJa}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

