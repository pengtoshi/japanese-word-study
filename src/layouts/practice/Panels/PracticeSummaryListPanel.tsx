"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Verdict = "perfect" | "acceptable" | "needs_fix";

export type PracticeSummaryProblemRow = {
  id: string;
  promptKo: string;
  modelAnswerJa: string;
  modelAnswerRubyHtml?: string | null;
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
    <Card className="mt-4">
      <div className="text-base font-semibold">10문제 요약</div>
      <div className="mt-3 space-y-2">
        {problems.map((p, idx) => {
          const n = idx + 1;
          const attempt = latestAttemptByProblemId.get(p.id) ?? null;
          const verdict = attempt?.verdict ?? null;
          const audioId = `problem-${p.id}`;

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
                <div className="flex items-start justify-between gap-2">
                  {p.modelAnswerRubyHtml ? (
                    <div
                      className="line-clamp-2 flex-1 whitespace-pre-wrap text-sm text-zinc-600 leading-7 [&_rt]:text-xs [&_rt]:text-(--muted)"
                      dangerouslySetInnerHTML={{ __html: p.modelAnswerRubyHtml }}
                    />
                  ) : (
                    <div className="line-clamp-2 flex-1 whitespace-pre-wrap text-sm text-zinc-600">
                      {p.modelAnswerJa}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label="발음 듣기"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handlePlayAudio(p.modelAnswerJa, audioId);
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
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

