"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type WrongProblem = {
  id: string;
  sessionId: string;
  index: number;
  promptKo: string;
  modelAnswerJa: string;
  modelAnswerRubyHtml: string;
  createdAt: string;
};

type RecentVocabItem = {
  id: string;
  listId: string;
  jaSurface: string;
  jaSurfaceRubyHtml: string;
  koMeaning: string | null;
  createdAt: string;
};

export function HomeQuickReviewPanel({
  todayProblemsCount,
  todayVocabCount,
  wrongProblems,
  recentVocabItems,
}: {
  todayProblemsCount: number;
  todayVocabCount: number;
  wrongProblems: WrongProblem[];
  recentVocabItems: RecentVocabItem[];
}) {
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlayAudio(text: string, audioId: string) {
    if (loadingAudioId === audioId) return;

    setLoadingAudioId(audioId);
    try {
      const res = await fetch(`/api/tts/sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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
      setPlayingAudioId(audioId);
      audio.addEventListener("ended", () => {
        setPlayingAudioId((current) => (current === audioId ? null : current));
      });
      await audio.play();
    } catch (e) {
      console.error("Failed to play TTS audio", e);
    } finally {
      setLoadingAudioId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* 오늘의 학습 통계 */}
      <Card>
        <div className="text-base font-semibold">오늘의 학습</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <div className="text-2xl font-semibold">{todayProblemsCount}</div>
            <div className="mt-1 text-xs text-(--muted)">푼 문제</div>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <div className="text-2xl font-semibold">{todayVocabCount}</div>
            <div className="mt-1 text-xs text-(--muted)">추가한 표현</div>
          </div>
        </div>
      </Card>

      {/* 최근 오답 문제 */}
      {wrongProblems.length > 0 ? (
        <Card>
          <div className="text-base font-semibold">최근 오답 문제</div>
          <div className="mt-3 space-y-2">
            {wrongProblems.slice(0, 10).map((problem) => {
              const audioId = `wrong-problem-${problem.id}`;
              return (
                <Link
                  key={problem.id}
                  href={`/app/practice/${problem.sessionId}?i=${problem.index}`}
                  className="block rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-(--muted)">
                        문제 {problem.index}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm text-zinc-700">
                        {problem.promptKo}
                      </div>
                      <div
                        className="mt-1 line-clamp-1 text-sm text-zinc-600 leading-7 [&_ruby]:ruby [&_rt]:text-xs [&_rt]:text-(--muted)"
                        dangerouslySetInnerHTML={{
                          __html: problem.modelAnswerRubyHtml,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="발음 듣기"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePlayAudio(problem.modelAnswerJa, audioId);
                      }}
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        "bg-transparent",
                        "text-(--muted) hover:text-foreground",
                        "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                      )}
                    >
                      {loadingAudioId === audioId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Volume2
                          className={cn(
                            "h-4 w-4",
                            playingAudioId === audioId ? "text-(--accent)" : undefined
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* 최근 추가한 표현 */}
      {recentVocabItems.length > 0 ? (
        <Card>
          <div className="text-base font-semibold">최근 추가한 표현</div>
          <div className="mt-3 space-y-2">
            {recentVocabItems.slice(0, 10).map((item) => {
              const audioId = `vocab-${item.id}`;
              return (
                <Link
                  key={item.id}
                  href={`/app/vocab/${item.listId}/${item.id}`}
                  className="block rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold [&_ruby]:ruby [&_rt]:text-xs [&_rt]:text-(--muted)"
                        dangerouslySetInnerHTML={{
                          __html: item.jaSurfaceRubyHtml,
                        }}
                      />
                      {item.koMeaning && (
                        <div className="mt-1 text-sm text-(--muted)">{item.koMeaning}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="발음 듣기"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePlayAudio(item.jaSurface, audioId);
                      }}
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        "bg-transparent",
                        "text-(--muted) hover:text-foreground",
                        "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                      )}
                    >
                      {loadingAudioId === audioId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Volume2
                          className={cn(
                            "h-4 w-4",
                            playingAudioId === audioId ? "text-(--accent)" : undefined
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* 빈 상태 */}
      {wrongProblems.length === 0 && recentVocabItems.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-sm text-(--muted)">
            아직 복습할 내용이 없어요.
            <br />
            연습을 시작하거나 표현을 추가해보세요.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
