"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type ManualVerdict = "perfect" | "needs_fix";

export function PracticeManualGradeForm({
  apiBaseUrl,
  problemId,
  nextHref,
  modelAnswerJa,
  altAnswerJa,
}: {
  apiBaseUrl: string;
  problemId: string;
  nextHref: string;
  modelAnswerJa: string;
  altAnswerJa?: string | null;
}) {
  const router = useRouter();
  const [userAnswerJa, setUserAnswerJa] = useState("");
  const [phase, setPhase] = useState<"editing" | "review" | "saving">("editing");
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => userAnswerJa.trim(), [userAnswerJa]);

  async function submit(verdict: ManualVerdict) {
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch(`${apiBaseUrl}/api/practice/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problemId,
          userAnswerJa: trimmed,
          verdict,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(`저장 실패: ${msg}`);
        setPhase("review");
        return;
      }

      router.push(nextHref);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`저장 실패: ${msg}`);
      setPhase("review");
    }
  }

  return (
    <Card className="mt-4">
      <div className="text-sm font-semibold text-zinc-900">답안</div>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="mt-3 space-y-3">
        {phase === "editing" ? (
          <Textarea
            value={userAnswerJa}
            onChange={(e) => setUserAnswerJa(e.target.value)}
            placeholder="일본어로 입력하세요"
            maxLength={2000}
          />
        ) : null}

        {phase === "editing" ? (
          <Button
            type="button"
            className="w-full"
            disabled={!trimmed}
            onClick={() => setPhase("review")}
          >
            확인
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-zinc-600">내</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{trimmed}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-600">답</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">
                  {modelAnswerJa}
                </div>
              </div>
              {altAnswerJa ? (
                <div>
                  <div className="text-xs font-semibold text-zinc-600">대안</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">
                    {altAnswerJa}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="w-full"
                disabled={phase === "saving"}
                onClick={() => submit("perfect")}
              >
                정답
              </Button>
              <Button
                type="button"
                className="w-full"
                variant="secondary"
                disabled={phase === "saving"}
                onClick={() => submit("needs_fix")}
              >
                오답
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              variant="ghost"
              disabled={phase === "saving"}
              onClick={() => setPhase("editing")}
            >
              다시 풀기
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

