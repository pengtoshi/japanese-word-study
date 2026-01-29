"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VocabItemSearch } from "@/layouts/vocab/Sections/VocabItemSearch";
import type { VocabItemRow } from "@/components/vocab/types";

export function VocabItemsPanel({
  listId,
  totalActiveCount,
  initialQuery,
  items,
  emptyMessage,
  deleteManyAction,
}: {
  listId: string;
  totalActiveCount: number;
  initialQuery: string;
  items: VocabItemRow[];
  emptyMessage: string;
  deleteManyAction: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [stagedIds, setStagedIds] = useState<Set<string>>(new Set());

  const returnTo = useMemo(() => {
    const qs = searchParams?.toString() ?? "";
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const visibleItems = useMemo(() => {
    if (stagedIds.size === 0) return items;
    return items.filter((it) => !stagedIds.has(it.id));
  }, [items, stagedIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">표현 목록</h2>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div
            className={cn(
              "rounded-full border border-(--border) bg-(--surface) px-3 py-1",
              "text-xs font-semibold text-(--muted)"
            )}
            aria-label="표현 개수"
          >
            {totalActiveCount}/100
          </div>

          {items.length > 0 ? (
            isEditing ? (
              <>
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
                      <input key={id} type="hidden" name="itemId" value={id} />
                    ))}
                    <input type="hidden" name="returnTo" value={returnTo} />
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
              </>
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
      </div>

      <VocabItemSearch listId={listId} initialQuery={initialQuery} />

      <div className="space-y-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((it) => (
            <div
              key={it.id}
              className={cn(
                "flex items-start justify-between gap-3 rounded-2xl border border-(--border) px-4 py-3",
                "bg-(--surface)"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{it.ja_surface}</span>
                  {it.ja_reading_hira ? (
                    <span className="text-sm text-(--muted)">
                      ({it.ja_reading_hira})
                    </span>
                  ) : null}
                  {!it.is_active ? (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-(--muted) dark:bg-white/10">
                      비활성
                    </span>
                  ) : null}
                </div>
                {it.ko_meaning ? (
                  <div className="mt-1 text-sm text-foreground">
                    {it.ko_meaning}
                  </div>
                ) : null}
                {it.memo ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs text-(--muted)">
                    {it.memo}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <button
                  type="button"
                  aria-label="삭제 예약"
                  onClick={() =>
                    setStagedIds((prev) => {
                      const next = new Set(prev);
                      next.add(it.id);
                      return next;
                    })
                  }
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
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--surface) px-4 py-8 text-sm text-(--muted)">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

