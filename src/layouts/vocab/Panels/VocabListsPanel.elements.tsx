"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatDateTimeKo } from "@/utils/format";

export type VocabListRow = {
  id: string;
  name: string;
  kind?: "manual" | "scenario" | null;
  created_at: string;
};

export function VocabListsPanel({
  lists,
  deleteManyAction,
}: {
  lists: VocabListRow[];
  deleteManyAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [stagedIds, setStagedIds] = React.useState<Set<string>>(new Set());

  const visibleLists = React.useMemo(() => {
    if (stagedIds.size === 0) return lists;
    return lists.filter((l) => !stagedIds.has(l.id));
  }, [lists, stagedIds]);

  const countLabel = React.useMemo(
    () => (lists.length > 0 ? String(lists.length) : ""),
    [lists.length]
  );

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">단어장 목록</h2>
          {countLabel ? (
            <span className="text-xs text-(--muted)">{countLabel}</span>
          ) : null}
        </div>

        {lists.length > 0 ? (
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
                    <input key={id} type="hidden" name="listId" value={id} />
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
        {visibleLists.length > 0 ? (
          visibleLists.map((l) => (
            <div key={l.id} className="relative">
              <Link
                href={`/app/vocab/${l.id}`}
                className={cn(
                  "block rounded-2xl border border-(--border) bg-(--surface) px-4 py-3",
                  "transition-transform",
                  isEditing ? "opacity-90" : "",
                  "active:scale-[0.99]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    {l.kind === "scenario" ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-(--accent)/10 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--accent)]">
                          상황별 단어장
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-(--muted)">
                      생성: {formatDateTimeKo(l.created_at)}
                    </div>
                  </div>

                  {isEditing ? (
                    <button
                      type="button"
                      aria-label="삭제 예약"
                      onClick={(e) => {
                        e.preventDefault();
                        setStagedIds((prev) => {
                          const next = new Set(prev);
                          next.add(l.id);
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
                  ) : null}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--surface) px-4 py-8 text-sm text-(--muted)">
            아직 단어장이 없어요.
          </div>
        )}
      </div>
    </Card>
  );
}

