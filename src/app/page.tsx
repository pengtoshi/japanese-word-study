import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/app");

  return (
    <div className="min-h-dvh bg-[color:var(--background)] px-4 py-8 text-[color:var(--foreground)]">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="pt-[env(safe-area-inset-top)]">
          <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">
            Japanese Helper
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            일본어 작문을
            <br />
            매일 10분으로.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            단어장을 만들고, 표현을 추가하고, 자동 생성된 문제로 연습한 뒤
            피드백을 받아보세요.
          </p>
        </header>

        <div className="grid gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-sm font-semibold text-white hover:bg-rose-600"
          >
            로그인
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm font-semibold text-[color:var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            계정 만들기
          </Link>
        </div>

        <Card>
          <div className="text-base font-semibold">핵심 기능</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
              <div className="text-sm font-semibold">단어장</div>
              <div className="mt-0.5 text-sm text-[color:var(--muted)]">
                표현을 저장하고 필요할 때 빠르게 꺼내요.
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
              <div className="text-sm font-semibold">연습</div>
              <div className="mt-0.5 text-sm text-[color:var(--muted)]">
                단어장 기반으로 문제 10개를 자동 생성해요.
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
              <div className="text-sm font-semibold">피드백</div>
              <div className="mt-0.5 text-sm text-[color:var(--muted)]">
                제출한 답안을 채점하고 개선 포인트를 알려줘요.
              </div>
            </div>
          </div>
        </Card>

        <div className="pb-[calc(env(safe-area-inset-bottom)+24px)] text-center text-xs text-[color:var(--muted)]">
          개인용 MVP · 중요한 비밀번호는 사용하지 마세요.
        </div>
      </div>
    </div>
  );
}
