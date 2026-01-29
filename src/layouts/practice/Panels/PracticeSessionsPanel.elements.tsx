"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Check, Trash2, RotateCcw, FileText } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type PracticeSessionCard = {
  id: string;
  listName: string;
  createdAt: string;
  jlptLevel: string;
  total: number;
  problemsCount: number;
  answeredCount: number;
  wrongCount: number;
  firstWrong: number | null;
};

export function PracticeSessionsList({
  sessions,
  deleteManyAction,
}: {
  sessions: PracticeSessionCard[];
  deleteManyAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [stagedIds, setStagedIds] = React.useState<Set<string>>(new Set());

  const visibleSessions = React.useMemo(() => {
    if (stagedIds.size === 0) return sessions;
    return sessions.filter((s) => !stagedIds.has(s.id));
  }, [sessions, stagedIds]);

  const countLabel = React.useMemo(
    () => (sessions.length > 0 ? String(sessions.length) : ""),
    [sessions.length]
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">최근 연습</h2>
          {countLabel ? (
            <span className="text-xs text-(--muted)">{countLabel}</span>
          ) : null}
        </div>

        {sessions.length > 0 ? (
          isEditing ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="되돌리기"
                onClick={() => {
                  setStagedIds(new Set());
                  setIsEditing(false);
                }}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-transparent",
                  "text-(--muted) hover:text-foreground",
                  "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                )}
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </button>

              {stagedIds.size > 0 ? (
                <form action={deleteManyAction}>
                  {[...stagedIds].map((id) => (
                    <input key={id} type="hidden" name="sessionId" value={id} />
                  ))}
                  <button
                    type="submit"
                    aria-label="삭제 적용"
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full",
                      "bg-transparent",
                      "text-(--muted) hover:text-foreground",
                      "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                    )}
                  >
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  aria-label="편집 종료"
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full",
                    "bg-transparent",
                    "text-(--muted) hover:text-foreground",
                    "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                  )}
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              aria-label="편집"
              onClick={() => {
                setStagedIds(new Set());
                setIsEditing(true);
              }}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full",
                "bg-transparent",
                "text-(--muted) hover:text-foreground",
                "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
              )}
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </button>
          )
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {visibleSessions.length > 0 ? (
          visibleSessions.map((s) => {
            const isGenerating = (s.problemsCount ?? 0) < s.total;
            const progressPct = s.total
              ? Math.min(100, Math.round((s.answeredCount / s.total) * 100))
              : 0;

            return (
              <div key={s.id} className="relative">
                <Link
                  href={isGenerating ? "#" : `/app/practice/${s.id}`}
                  aria-disabled={isGenerating}
                  className={cn(
                    "block rounded-2xl border border-(--border) bg-(--surface) px-4 py-3",
                    "transition-transform",
                    isEditing ? "opacity-90" : "",
                    isGenerating
                      ? "pointer-events-none opacity-60"
                      : "active:scale-[0.99]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-semibold">
                          {s.listName}
                        </div>
                        <Badge>{String(s.jlptLevel).toUpperCase()}</Badge>
                        {s.wrongCount > 0 ? (
                          <Badge variant="danger">오답 {s.wrongCount}</Badge>
                        ) : null}
                        {isGenerating ? <Badge>생성 중</Badge> : null}
                      </div>
                      <div className="mt-1 text-xs text-(--muted)">
                        {s.answeredCount}/{s.total}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {!isEditing ? (
                        <button
                          type="button"
                          aria-label="요약"
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-full",
                            "bg-transparent",
                            "text-(--muted) hover:text-foreground",
                            "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isGenerating) return;
                            router.push(`/app/practice/${s.id}/summary`);
                          }}
                        >
                          <FileText className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="삭제 예약"
                          onClick={(e) => {
                            e.preventDefault();
                            setStagedIds((prev) => {
                              const next = new Set(prev);
                              next.add(s.id);
                              return next;
                            });
                          }}
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-full",
                            "bg-transparent",
                            "text-red-600 hover:bg-red-50 active:bg-red-100"
                          )}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                    <div
                      className="h-full bg-(--accent)"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--surface) px-4 py-8 text-sm text-(--muted)">
            아직 연습 기록이 없어요.
          </div>
        )}
      </div>
    </Card>
  );
}

