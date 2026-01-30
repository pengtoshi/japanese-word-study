import Link from "next/link";
import { Card } from "@/components/ui/Card";

export type PracticeSessionResultData = {
  verdict: "perfect" | "acceptable" | "needs_fix";
  userAnswerJa: string;
};

function RubyBlock({
  html,
  text,
}: {
  html?: string | null;
  text: string;
}) {
  return html ? (
    <div
      className="mt-1 whitespace-pre-wrap text-sm leading-7 [&_rt]:text-xs [&_rt]:text-(--muted)"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <div className="mt-1 whitespace-pre-wrap text-sm leading-7">{text}</div>
  );
}

export function PracticeSessionResultSection({
  result,
  modelAnswerJa,
  modelAnswerRubyHtml,
  altAnswerJa,
  altAnswerRubyHtml,
  userAnswerRubyHtml,
  nextHref,
  nextLabel = "다음 문제로",
  redoHref,
}: {
  result: PracticeSessionResultData;
  modelAnswerJa: string;
  modelAnswerRubyHtml?: string | null;
  altAnswerJa?: string | null;
  altAnswerRubyHtml?: string | null;
  userAnswerRubyHtml?: string | null;
  nextHref: string;
  nextLabel?: string;
  redoHref: string;
}) {
  return (
    <Card className="mt-4">
      <div className="text-sm font-semibold">
        결과: {result.verdict === "needs_fix" ? "오답" : "정답"}
      </div>
      <div className="mt-4 space-y-2">
        <div>
          <div className="text-xs font-semibold text-zinc-600">내 답안</div>
          <RubyBlock html={userAnswerRubyHtml} text={result.userAnswerJa} />
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600">모범 답안</div>
          <RubyBlock html={modelAnswerRubyHtml} text={modelAnswerJa} />
        </div>
        {altAnswerJa ? (
          <div>
            <div className="text-xs font-semibold text-zinc-600">대안</div>
            <RubyBlock html={altAnswerRubyHtml} text={altAnswerJa} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={nextHref}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white hover:bg-rose-600"
        >
          {nextLabel}
        </Link>
        <Link
          href={redoHref}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          다시 풀기
        </Link>
      </div>
    </Card>
  );
}

