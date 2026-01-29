"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  isActive: (pathname: string) => boolean;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5.5C4 4.1 5.1 3 6.5 3H20v18H6.5C5.1 21 4 19.9 4 18.5V5.5Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l1.2 4.2L17 7.4l-3.8 1.2L12 13l-1.2-4.4L7 7.4l3.8-1.2L12 2Z" />
      <path d="M5 12l.8 2.7L8.5 16l-2.7.8L5 19.5l-.8-2.7L1.5 16l2.7-.8L5 12Z" />
      <path d="M19 12l.7 2.4L22 15l-2.3.6L19 18l-.7-2.4L16 15l2.3-.6L19 12Z" />
    </svg>
  );
}

const tabs: Tab[] = [
  {
    href: "/app",
    label: "홈",
    icon: HomeIcon,
    isActive: (p) => p === "/app" || p === "/app/",
  },
  {
    href: "/app/vocab",
    label: "단어장",
    icon: BookIcon,
    isActive: (p) => p.startsWith("/app/vocab"),
  },
  {
    href: "/app/practice",
    label: "연습",
    icon: SparkIcon,
    isActive: (p) => p.startsWith("/app/practice"),
  },
];

export function BottomTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="하단 탭"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto w-full max-w-xl px-4 pb-3">
        <div
          className={cn(
            "grid grid-cols-3 overflow-hidden rounded-2xl",
            "border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur",
            "shadow-[var(--shadow-float)]"
          )}
        >
          {tabs.map((t) => {
            const active = t.isActive(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold",
                  active
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                )}
              >
                <t.icon
                  className={cn(
                    active ? "text-[color:var(--accent)]" : "text-current"
                  )}
                />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

