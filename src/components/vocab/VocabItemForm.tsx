"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Asterisk, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import type { VocabItemCreateActionState } from "@/components/vocab/types";

function FieldLabel({
  label,
  requiredMark,
}: {
  label: string;
  requiredMark?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">{label}</span>
      {requiredMark ? (
        <Asterisk className="h-3 w-3 text-red-500" aria-hidden="true" />
      ) : null}
    </div>
  );
}

function LabeledInput({
  label,
  requiredMark,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  requiredMark?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <FieldLabel label={label} requiredMark={requiredMark} />
      <Input {...props} />
    </label>
  );
}

function LabeledTextarea({
  label,
  requiredMark,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string;
  requiredMark?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <FieldLabel label={label} requiredMark={requiredMark} />
      <Textarea {...props} />
    </label>
  );
}

export function VocabItemForm({
  action,
  onResult,
  beforeFields,
}: {
  action: (
    prevState: VocabItemCreateActionState,
    formData: FormData
  ) => Promise<VocabItemCreateActionState>;
  onResult?: (state: VocabItemCreateActionState) => void;
  /**
   * 폼 필드(일본어/뜻/메모) 위에 추가로 렌더할 요소.
   * 예: 단어장 선택 UI(hidden input 포함)
   */
  beforeFields?: React.ReactNode;
}) {
  const [jaSurface, setJaSurface] = useState("");
  const [jaReadingHira, setJaReadingHira] = useState("");
  const [koMeaning, setKoMeaning] = useState("");
  const [memo, setMemo] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiHint, setShowAiHint] = useState(true);

  const canShowAi = useMemo(() => jaSurface.trim().length > 0, [jaSurface]);
  const isFormValid = useMemo(() => {
    return jaSurface.trim().length > 0 && koMeaning.trim().length > 0;
  }, [jaSurface, koMeaning]);

  const [submitState, formAction, isSubmitting] = useActionState(
    action,
    { status: "idle" } satisfies VocabItemCreateActionState
  );

  useEffect(() => {
    if (submitState.status === "idle") return;
    onResult?.(submitState);

    if (submitState.status === "success") {
      setJaSurface("");
      setJaReadingHira("");
      setKoMeaning("");
      setMemo("");
      setAiError(null);
      setShowAiHint(true);
    }
  }, [submitState, onResult]);

  async function onAutoFill() {
    setAiError(null);
    const surface = jaSurface.trim();
    if (!surface) return;

    setShowAiHint(false);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/vocab/autofill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jaSurface: surface }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "자동 생성에 실패했어요.");
      }

      const data = (await res.json()) as {
        koMeaning: string;
        jaReadingHira?: string;
      };

      setKoMeaning(data.koMeaning ?? "");
      if (typeof data.jaReadingHira === "string") {
        setJaReadingHira(data.jaReadingHira);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "자동 생성에 실패했어요.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <form action={formAction} className="space-y-3">
      {aiError ? <Alert tone="danger">{aiError}</Alert> : null}
      {submitState.status === "error" ? (
        <Alert tone="danger">{submitState.message}</Alert>
      ) : null}

      {beforeFields ?? null}

      <div className="grid gap-3">
        <label className="block space-y-1">
          <FieldLabel label="일본어 원문(표기)" requiredMark />
          <div className="flex gap-2">
            <Input
              name="jaSurface"
              placeholder="예: 締め切り / 〜に違いない / コンビニ"
              maxLength={200}
              required
              value={jaSurface}
              onChange={(e) => setJaSurface(e.target.value)}
              disabled={isGenerating}
            />
            <div className="relative shrink-0">
              {showAiHint && canShowAi && !isGenerating ? (
                <div
                  className={cn(
                    "absolute right-0 top-[-2px] -translate-y-full",
                    "rounded-xl",
                    "bg-(--accent) text-white",
                    "px-3 py-2 text-xs font-semibold",
                    "shadow-(--shadow-card)",
                    "whitespace-nowrap"
                  )}
                  role="status"
                  aria-live="polite"
                >
                  AI 자동 생성
                  <div
                    className={cn(
                      "absolute right-5 top-full h-2 w-2 -translate-y-1 rotate-45",
                      "bg-(--accent)"
                    )}
                    aria-hidden="true"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={onAutoFill}
                disabled={isGenerating || !canShowAi}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                  "bg-transparent",
                  "transition-colors",
                  "hover:bg-(--accent)/10 active:bg-(--accent)/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/40",
                  "disabled:opacity-60"
                )}
                aria-label="AI로 자동 생성"
              >
                <Sparkles
                  className={cn(
                    "h-5 w-5 text-(--accent)",
                    isGenerating ? "animate-pulse" : ""
                  )}
                />
              </button>
            </div>
          </div>
        </label>

        <LabeledInput
          label="후리가나(히라가나)"
          name="jaReadingHira"
          placeholder="예: しめきり"
          maxLength={200}
          value={jaReadingHira}
          onChange={(e) => setJaReadingHira(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      <LabeledInput
        label="뜻(한국어)"
        requiredMark
        name="koMeaning"
        placeholder="예: 마감, 기한"
        maxLength={400}
        required
        value={koMeaning}
        onChange={(e) => setKoMeaning(e.target.value)}
        disabled={isGenerating}
      />

      <LabeledTextarea
        label="메모"
        name="memo"
        placeholder="예: 비즈니스에서 자주 사용 / 문법 포인트 등"
        maxLength={800}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        disabled={isGenerating}
      />

      <FormSubmitButton
        type="submit"
        className="w-full"
        disabled={!isFormValid || isGenerating || isSubmitting}
        pendingText="저장 중"
      >
        추가하기
      </FormSubmitButton>
    </form>
  );
}

