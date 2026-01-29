import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type PracticeQuickNavItem = {
  id: string;
  n: number;
  href: string;
  isCurrent: boolean;
  toneClassName: string;
};

export function PracticeSessionQuickNavSection({
  sessionId,
  answeredCount,
  total,
  isWrongMode,
  items,
  resetModal,
}: {
  sessionId: string;
  answeredCount: number;
  total: number;
  isWrongMode: boolean;
  items: PracticeQuickNavItem[];
  resetModal: React.ReactNode;
}) {
  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">문제 선택</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-600">
            {answeredCount}/{total} 완료
          </div>
          {resetModal}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {items.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={cn(
              "h-10 rounded-xl border text-sm font-semibold",
              "inline-flex items-center justify-center",
              it.toneClassName,
              it.isCurrent ? "ring-2 ring-zinc-900/20" : "hover:bg-zinc-50"
            )}
          >
            {it.n}
          </Link>
        ))}
      </div>

      {!isWrongMode && answeredCount === total ? (
        <div className="mt-3">
          <Link
            href={`/app/practice/${sessionId}/summary`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white hover:bg-rose-600"
          >
            세션 요약 보기
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

