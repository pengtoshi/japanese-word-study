import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TopBarConfig } from "@/components/TopBarProvider";

export default async function AppHomePage() {
  return (
    <div className="space-y-4">
      <TopBarConfig title="홈" backHref={null} />
      <Card>
        <div className="text-sm font-semibold">빠른 작업</div>
        <div className="mt-3 grid gap-2">
          <Link
            href="/app/vocab"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold">단어장/표현</div>
              <div className="mt-0.5 text-xs text-[color:var(--muted)]">
                추가·검색·정리
              </div>
            </div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">
              열기
            </div>
          </Link>

          <Link
            href="/app/practice"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 text-sm font-semibold text-white hover:bg-rose-600"
          >
            연습 시작(문제 10개 생성)
          </Link>
        </div>
      </Card>
    </div>
  );
}
