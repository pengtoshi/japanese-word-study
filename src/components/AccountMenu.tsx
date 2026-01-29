"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_JLPT_LEVEL,
  JLPT_LEVELS,
  type JlptLevel,
  jlptLabel,
} from "@/lib/jlpt";
import { BottomSheetSelect } from "@/components/BottomSheetSelect";
import { toast } from "@/components/ui/Toaster";

type Props = {
  email?: string | null;
  initialJlptLevel?: JlptLevel | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function AccountMenu({ email, initialJlptLevel }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [jlptLevel, setJlptLevel] = useState<JlptLevel>(
    initialJlptLevel ?? DEFAULT_JLPT_LEVEL
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save(next: JlptLevel) {
    setJlptLevel(next);
    setSaveState("saving");
    setErrorMessage(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setSaveState("error");
        setErrorMessage("로그인이 필요해요.");
        toast({ type: "error", title: "난이도를 저장하지 못했어요", description: "로그인이 필요해요." });
        return;
      }

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          jlpt_level: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        setSaveState("error");
        setErrorMessage(error.message);
        toast({ type: "error", title: "난이도를 저장하지 못했어요", description: error.message });
        return;
      }

      setSaveState("saved");
      toast({ type: "success", title: "난이도 저장됨", description: jlptLabel(next) });
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (e) {
      setSaveState("error");
      setErrorMessage(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
      toast({
        type: "error",
        title: "난이도를 저장하지 못했어요",
        description: e instanceof Error ? e.message : "저장 중 오류가 발생했어요.",
      });
    }
  }

  return (
    <details className="relative">
      <summary
        className={cn(
          "list-none",
          "inline-flex h-10 w-10 items-center justify-center rounded-full",
          "border border-[color:var(--border)] bg-[color:var(--surface)]",
          "shadow-[var(--shadow-card)]",
          "text-sm font-semibold text-[color:var(--foreground)]",
          "hover:bg-black/5 dark:hover:bg-white/10"
        )}
        aria-label="계정 메뉴"
      >
        ⋯
      </summary>

      <div
        className={cn(
          "absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl",
          "border border-[color:var(--border)] bg-[color:var(--surface)]",
          "shadow-[var(--shadow-float)]"
        )}
      >
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-[color:var(--muted)]">
            계정
          </div>
          <div className="mt-1 truncate text-sm font-semibold">
            {email ?? "로그인됨"}
          </div>
        </div>

        <div className="h-px bg-[color:var(--border)]" />

        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-[color:var(--muted)]">
            연습 난이도
          </div>
          <div className="mt-2">
            <BottomSheetSelect
              value={jlptLevel}
              onValueChange={(v) => save(v as JlptLevel)}
              sheetTitle="연습 난이도 선택"
              options={JLPT_LEVELS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              buttonClassName="shadow-none"
            />
          </div>

          {saveState === "saving" ? (
            <div className="mt-2 text-xs text-[color:var(--muted)]">저장 중...</div>
          ) : null}
          {saveState === "error" ? (
            <div className="mt-2 text-xs text-red-700">
              저장 실패: {errorMessage ?? ""}
            </div>
          ) : null}
        </div>

        <div className="h-px bg-[color:var(--border)]" />

        <form action="/auth/signout" method="post" className="p-2">
          <button
            type="submit"
            className={cn(
              "inline-flex h-11 w-full items-center justify-center rounded-xl",
              "border border-[color:var(--border)] bg-[color:var(--surface)]",
              "text-sm font-semibold text-red-700 hover:bg-red-50"
            )}
          >
            로그아웃
          </button>
        </form>
      </div>
    </details>
  );
}

