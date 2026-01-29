 "use client";

import { BottomTabs } from "@/components/BottomTabs";
import { TopBarProvider } from "@/components/TopBarProvider";
import { AccountMenu } from "@/components/AccountMenu";
import type { JlptLevel } from "@/lib/jlpt";

export function AppShell({
  email,
  jlptLevel,
  children,
}: {
  email?: string | null;
  jlptLevel?: JlptLevel | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[color:var(--background)] text-[color:var(--foreground)]">
      <TopBarProvider right={<AccountMenu email={email} initialJlptLevel={jlptLevel} />}>
        <main className="px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+108px)]">
          {children}
        </main>
      </TopBarProvider>

      <BottomTabs />
    </div>
  );
}
