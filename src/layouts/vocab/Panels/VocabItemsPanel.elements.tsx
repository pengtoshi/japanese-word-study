"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Asterisk,
  Check,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VocabItemSearch } from "@/layouts/vocab/Sections/VocabItemSearch";
import type { VocabItemRow } from "@/components/vocab/types";

function IconToggleButton({
  pressed,
  onPressedChange,
  label,
  children,
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl",
        "bg-transparent",
        "transition-colors",
        pressed ? "text-(--accent)" : "text-(--muted) hover:text-foreground",
        pressed
          ? "bg-(--accent)/10"
          : "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

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

  // 표시 기준 토글 (기본: 모두 표시 ON)
  const [showFurigana, setShowFurigana] = useState(true);
  const [showKo, setShowKo] = useState(true);
  const [showJa, setShowJa] = useState(true);

  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlayAudio(item: VocabItemRow) {
    if (loadingAudioId === item.id) return;

    setLoadingAudioId(item.id);
    try {
      const res = await fetch(`/api/tts/vocab?itemId=${encodeURIComponent(item.id)}`, {
        method: "POST",
      });
      if (!res.ok) {
        console.error("Failed to fetch TTS audio:", await res.text());
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        console.error("TTS API did not return url");
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(data.url);
      audioRef.current = audio;
      setPlayingAudioId(item.id);
      audio.addEventListener("ended", () => {
        setPlayingAudioId((current) => (current === item.id ? null : current));
      });
      await audio.play();
    } catch (e) {
      console.error("Failed to play TTS audio", e);
    } finally {
      setLoadingAudioId(null);
    }
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-start gap-0.5">
              <h2 className="text-base font-semibold">표현 목록</h2>
              <div className="mt-1 text-xs text-(--muted) sm:hidden">
                {totalActiveCount}/100
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {!isEditing ? (
                <>
                  <IconToggleButton
                    pressed={showFurigana}
                    onPressedChange={setShowFurigana}
                    label={showFurigana ? "후리가나 표시" : "후리가나 숨김"}
                  >
                    <Asterisk className="h-5 w-5" aria-hidden="true" />
                  </IconToggleButton>
                  <IconToggleButton
                    pressed={showKo}
                    onPressedChange={setShowKo}
                    label={showKo ? "한국어 표시" : "한국어 숨김"}
                  >
                    <Info className="h-5 w-5" aria-hidden="true" />
                  </IconToggleButton>
                  <IconToggleButton
                    pressed={showJa}
                    onPressedChange={setShowJa}
                    label={showJa ? "일본어 표시" : "일본어 숨김"}
                  >
                    {showJa ? (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    )}
                  </IconToggleButton>
                </>
              ) : null}

              <div
                className={cn(
                  "hidden sm:inline-flex h-10 items-center rounded-full",
                  "bg-black/5 px-3 text-xs font-semibold text-(--muted)",
                  "dark:bg-white/10"
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
                        "inline-flex h-10 w-10 items-center justify-center rounded-xl",
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
                          <input
                            key={id}
                            type="hidden"
                            name="itemId"
                            value={id}
                          />
                        ))}
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          aria-label="삭제 적용"
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl",
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
                          "inline-flex h-10 w-10 items-center justify-center rounded-xl",
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
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl",
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
                {showJa ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {it.ja_surface_ruby_html ? (
                      <span
                        className={cn(
                          "font-semibold [&_ruby]:ruby",
                          !showFurigana
                            ? "[&_rt]:hidden"
                            : "[&_rt]:text-[11px] [&_rt]:text-(--muted)"
                        )}
                        // HTML is produced by kuroshiro (server-side).
                        dangerouslySetInnerHTML={{ __html: it.ja_surface_ruby_html }}
                      />
                    ) : (
                      <>
                        <span className="font-semibold">{it.ja_surface}</span>
                        {it.ja_reading_hira && showFurigana ? (
                          <span className="text-sm text-(--muted)">
                            ({it.ja_reading_hira})
                          </span>
                        ) : null}
                      </>
                    )}
                    {!it.is_active ? (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-(--muted) dark:bg-white/10">
                        비활성
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {it.ko_meaning && showKo ? (
                  <div className="mt-1 text-sm text-foreground">{it.ko_meaning}</div>
                ) : null}
                {it.memo ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs text-(--muted)">
                    {it.memo}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                {!isEditing ? (
                  <button
                    type="button"
                    aria-label="발음 듣기"
                    onClick={() => handlePlayAudio(it)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full",
                      "bg-transparent",
                      "text-(--muted) hover:text-foreground",
                      "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                    )}
                  >
                    {loadingAudioId === it.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2
                        className={cn(
                          "h-4 w-4",
                          playingAudioId === it.id ? "text-(--accent)" : undefined
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : null}

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

