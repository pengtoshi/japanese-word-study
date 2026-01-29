"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/app",
    [searchParams]
  );

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "로그인에 실패했어요. 다시 시도해주세요.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[color:var(--background)] px-4 py-6 text-[color:var(--foreground)]">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <header className="mb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">
                  Japanese Helper
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {mode === "signin" ? "로그인" : "계정 만들기"}
                </h1>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  이메일과 비밀번호로 빠르게 시작하세요.
                </p>
              </div>
            </div>

            {/* segmented toggle */}
            <div className="mt-4">
              <div
                role="tablist"
                aria-label="로그인/회원가입 선택"
                className={cn(
                  "grid grid-cols-2 rounded-full p-1",
                  "border border-[color:var(--border)] bg-black/5 dark:bg-white/10"
                )}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => setMode("signin")}
                  className={cn(
                    "h-10 rounded-full text-sm font-semibold",
                    mode === "signin"
                      ? "bg-[color:var(--surface)] shadow-[var(--shadow-card)]"
                      : "text-[color:var(--muted)]"
                  )}
                >
                  로그인
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => setMode("signup")}
                  className={cn(
                    "h-10 rounded-full text-sm font-semibold",
                    mode === "signup"
                      ? "bg-[color:var(--surface)] shadow-[var(--shadow-card)]"
                      : "text-[color:var(--muted)]"
                  )}
                >
                  회원가입
                </button>
              </div>
            </div>
          </header>

          <form onSubmit={onSubmit} className="space-y-4">
            <div aria-live="polite">
              {errorMessage ? (
                <Alert tone="danger">{errorMessage}</Alert>
              ) : null}
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">이메일</span>
              <Input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
                required
                disabled={isLoading}
                autoFocus
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">비밀번호</span>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder="최소 8자"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pr-12"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading || password.length === 0}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "inline-flex h-9 w-9 items-center justify-center rounded-full",
                    "text-sm font-semibold",
                    "text-[color:var(--muted)] hover:bg-black/5 hover:text-[color:var(--foreground)]",
                    "disabled:opacity-40 dark:hover:bg-white/10"
                  )}
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>
              <span className="text-xs text-[color:var(--muted)]">
                최소 8자 · {mode === "signin" ? "기존 계정으로 로그인" : "새 계정을 생성"}
              </span>
            </label>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? "처리 중..."
                : mode === "signin"
                ? "로그인"
                : "회원가입"}
            </Button>

            <div className="pt-1 text-center text-xs text-[color:var(--muted)]">
              개인용 MVP입니다. 중요한 비밀번호는 사용하지 마세요.
            </div>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm">
            <span className="text-[color:var(--muted)]">
              {mode === "signin" ? "계정이 없나요?" : "이미 계정이 있나요?"}
            </span>
            <button
              type="button"
              className="font-semibold text-[color:var(--foreground)] underline-offset-4 hover:underline"
              onClick={() =>
                setMode((m) => (m === "signin" ? "signup" : "signin"))
              }
            >
              {mode === "signin" ? "회원가입" : "로그인"}으로 전환
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
