import Link from "next/link";
import { cn } from "@/lib/utils";

export function PracticeSummaryHeaderSection({
  sessionId,
  firstWrong,
}: {
  sessionId: string;
  firstWrong: number | null;
}) {
  return (
    <div className="grid gap-2">
      <Link
        href={`/app/practice/${sessionId}`}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white text-sm font-semibold hover:bg-zinc-50"
      >
        세션 다시 보기
      </Link>
      <Link
        href={firstWrong ? `/app/practice/${sessionId}?mode=wrong&i=${firstWrong}` : "#"}
        aria-disabled={!firstWrong}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center rounded-xl bg-(--accent) text-sm font-semibold text-white hover:bg-rose-600",
          !firstWrong ? "pointer-events-none opacity-50" : ""
        )}
      >
        오답 다시 풀기
      </Link>
      {!firstWrong ? (
        <div className="text-center text-xs text-zinc-600">오답이 없어요.</div>
      ) : null}
    </div>
  );
}

