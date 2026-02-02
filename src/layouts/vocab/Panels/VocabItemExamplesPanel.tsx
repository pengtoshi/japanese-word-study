"use client";

import { useMemo, useRef, useState } from "react";
import {
  Asterisk,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Volume2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type ProblemWithAttempt = {
  id: string;
  prompt_ko: string;
  model_answer_ja: string;
  alt_answer_ja: string | null;
  session_id: string;
  created_at: string;
  hasAttempt: boolean;
  latestAttempt: {
    verdict: "perfect" | "acceptable" | "needs_fix";
    user_answer_ja: string;
    created_at: string;
  } | null;
  model_answer_ruby_html: string;
  alt_answer_ruby_html: string | null;
  user_answer_ruby_html: string | null;
};

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

function RubyBlock({
  html,
  text,
  showFurigana,
}: {
  html?: string | null;
  text: string;
  showFurigana: boolean;
}) {
  return html ? (
    <div
      className={cn(
        "whitespace-pre-wrap text-sm leading-7 [&_ruby]:ruby",
        showFurigana
          ? "[&_rt]:text-xs [&_rt]:text-(--muted)"
          : "[&_rt]:hidden"
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <div className="whitespace-pre-wrap text-sm leading-7">{text}</div>
  );
}

export function VocabItemExamplesPanel({
  problems,
  totalCount,
  learnedCount,
}: {
  problems: ProblemWithAttempt[];
  totalCount: number;
  learnedCount: number;
}) {
  const [currentFilter, setCurrentFilter] = useState<"all" | "learned">("learned");
  const [showFurigana, setShowFurigana] = useState(true);
  const [showKo, setShowKo] = useState(true);
  const [showJa, setShowJa] = useState(true);

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

  // Filter problems based on current filter
  const filteredProblems = useMemo(() => {
    if (currentFilter === "learned") {
      return problems.filter((p) => p.hasAttempt);
    }
    return problems;
  }, [problems, currentFilter]);

  return (
    <div className="space-y-4">
      {/* Header with filters and display options */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-start gap-0.5">
              <h2 className="text-base font-semibold">예문</h2>
              <div className="mt-1 text-xs text-(--muted) sm:hidden">
                {currentFilter === "learned" ? learnedCount : totalCount}개
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
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

              <div
                className={cn(
                  "hidden sm:inline-flex h-10 items-center rounded-full",
                  "bg-black/5 px-3 text-xs font-semibold text-(--muted)",
                  "dark:bg-white/10"
                )}
                aria-label="예문 개수"
              >
                {currentFilter === "learned" ? learnedCount : totalCount}개
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCurrentFilter("learned")}
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
            currentFilter === "learned"
              ? "bg-(--accent) text-white"
              : "border border-(--border) bg-(--surface) text-foreground hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          학습한 예문 ({learnedCount})
        </button>
        <button
          type="button"
          onClick={() => setCurrentFilter("all")}
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
            currentFilter === "all"
              ? "bg-(--accent) text-white"
              : "border border-(--border) bg-(--surface) text-foreground hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          모든 예문 ({totalCount})
        </button>
      </div>

      {/* Example sentences */}
      <div className="space-y-3">
        {filteredProblems.length > 0 ? (
          filteredProblems.map((problem) => {
            const audioId = `problem-${problem.id}`;
            const verdict = problem.latestAttempt?.verdict;

            return (
              <div
                key={problem.id}
                className="rounded-2xl border border-(--border) bg-(--surface) p-4"
              >
                {/* Prompt (Korean) */}
                {showKo && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-foreground">
                      {problem.prompt_ko}
                    </div>
                  </div>
                )}

                {/* Model Answer */}
                {showJa && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-xs font-semibold text-(--muted)">
                        모범 답안
                      </div>
                      <button
                        type="button"
                        aria-label="발음 듣기"
                        onClick={() =>
                          handlePlayAudio(problem.model_answer_ja, `${audioId}-model`)
                        }
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full",
                          "bg-transparent",
                          "text-(--muted) hover:text-foreground",
                          "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                        )}
                      >
                        {loadingAudioId === `${audioId}-model` ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Volume2
                            className={cn(
                              "h-4 w-4",
                              playingAudioId === `${audioId}-model`
                                ? "text-(--accent)"
                                : undefined
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>
                    <RubyBlock
                      html={problem.model_answer_ruby_html}
                      text={problem.model_answer_ja}
                      showFurigana={showFurigana}
                    />
                  </div>
                )}

                {/* User Answer (if attempted) */}
                {problem.hasAttempt && problem.latestAttempt && showJa && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-(--muted)">
                          내 답안
                        </div>
                        {verdict === "perfect" || verdict === "acceptable" ? (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            정답
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-xs">
                            <XCircle className="h-3 w-3" aria-hidden="true" />
                            오답
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label="발음 듣기"
                        onClick={() =>
                          handlePlayAudio(
                            problem.latestAttempt!.user_answer_ja,
                            `${audioId}-user`
                          )
                        }
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full",
                          "bg-transparent",
                          "text-(--muted) hover:text-foreground",
                          "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                        )}
                      >
                        {loadingAudioId === `${audioId}-user` ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Volume2
                            className={cn(
                              "h-4 w-4",
                              playingAudioId === `${audioId}-user`
                                ? "text-(--accent)"
                                : undefined
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>
                    <RubyBlock
                      html={problem.user_answer_ruby_html}
                      text={problem.latestAttempt.user_answer_ja}
                      showFurigana={showFurigana}
                    />
                  </div>
                )}

                {/* Alternative Answer */}
                {problem.alt_answer_ja && showJa && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-(--muted)">
                      대안
                    </div>
                    <RubyBlock
                      html={problem.alt_answer_ruby_html}
                      text={problem.alt_answer_ja}
                      showFurigana={showFurigana}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--surface) px-4 py-8 text-sm text-(--muted)">
            {currentFilter === "learned"
              ? "아직 학습한 예문이 없어요."
              : "이 표현이 사용된 예문이 없어요."}
          </div>
        )}
      </div>
    </div>
  );
}
