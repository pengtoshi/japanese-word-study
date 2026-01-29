"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type TopBarConfig = {
  title?: string;
  subtitle?: string;
  backHref?: string | null;
};

export function TopBar({
  config,
  right,
}: {
  config: TopBarConfig;
  right?: React.ReactNode;
}) {
  const { title, subtitle, backHref } = config;

  return (
    <header
      className={cn(
        "sticky top-0 z-20",
        "border-b border-[color:var(--border)] bg-[color:var(--background)]/85 backdrop-blur",
        "pt-[env(safe-area-inset-top)]"
      )}
    >
      <div className="mx-auto w-full max-w-xl px-4 py-3">
        <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="뒤로가기"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full",
                "border border-[color:var(--border)] bg-[color:var(--surface)]",
                "shadow-[var(--shadow-card)]",
                "hover:bg-black/5 dark:hover:bg-white/10"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          ) : (
            <div aria-hidden="true" className="h-10 w-10" />
          )}

          <div className="min-w-0 text-center">
            {title ? (
              <div className="truncate text-base font-semibold tracking-tight">
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div className="mt-0.5 truncate text-xs text-[color:var(--muted)]">
                {subtitle}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">{right ?? <div />}</div>
        </div>
      </div>
    </header>
  );
}

