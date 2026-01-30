 "use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { PendingModal } from "@/components/PendingModal";

export function CreateScenarioVocabListForm() {
  const router = useRouter();
  const [scenarioPrompt, setScenarioPrompt] = React.useState("");
  const [problemCount, setProblemCount] = React.useState(10);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    const prompt = scenarioPrompt.trim();
    if (prompt.length < 3) {
      toast({ type: "error", title: "상황 프롬프트를 입력해주세요" });
      return;
    }

    const count = Number(problemCount);
    if (!Number.isFinite(count) || count < 1 || count > 50) {
      toast({ type: "error", title: "문제 개수는 1~50 사이로 입력해주세요" });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/vocab/scenario-create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioPrompt: prompt, problemCount: count }),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast({
          type: "error",
          title: "단어장 생성 실패",
          description: msg || "잠시 후 다시 시도해주세요.",
        });
        return;
      }

      const data = (await res.json()) as {
        ok: true;
        listId: string;
        sessionId: string;
      };

      toast({ type: "success", title: "단어장을 만들었어요" });
      // 토스트가 살짝 보이는 시간을 준 다음 이동
      setTimeout(() => {
        router.push(`/app/vocab/${encodeURIComponent(data.listId)}?createdSessionId=${encodeURIComponent(data.sessionId)}`);
      }, 250);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ type: "error", title: "단어장 생성 실패", description: msg });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-3">
        <Textarea
          name="scenarioPrompt"
          value={scenarioPrompt}
          onChange={(e) => setScenarioPrompt(e.target.value)}
          placeholder={
            "예: 일본 여행 중 식당에서 주문/요청/불만을 말하는 상황\n예: 회사에서 회의 일정 조율/업무 요청을 하는 상황"
          }
          maxLength={800}
          required
          disabled={pending}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-(--muted)">문제 개수</div>
            <Input
              name="problemCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={problemCount}
              onChange={(e) => setProblemCount(Number(e.target.value))}
              required
              disabled={pending}
            />
          </label>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "생성 중..." : "상황별 단어장 만들기"}
        </Button>
      </form>

      <PendingModal
        open={pending}
        srTitle="단어장 생성 중"
        title="단어장 생성 중"
        description="잠시만 기다려주세요…"
        footer="연습문제를 만들고, 거기서 단어를 뽑아 단어장에 저장하고 있어요."
      />
    </>
  );
}

