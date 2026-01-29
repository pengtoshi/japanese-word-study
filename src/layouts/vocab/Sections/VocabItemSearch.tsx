"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function VocabItemSearch({
  listId,
  initialQuery,
  debounceMs = 200,
}: {
  listId: string;
  initialQuery: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialQuery);
  const [isComposing, setIsComposing] = useState(false);
  const lastPushedRef = useRef<string>(initialQuery);

  useEffect(() => {
    if (!pathname) return;
    if (isComposing) return;

    const next = value.trim();
    const current = lastPushedRef.current.trim();
    if (next === current) return;

    const t = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (next.length > 0) params.set("q", next);
      else params.delete("q");

      const qs = params.toString();
      lastPushedRef.current = next;

      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, debounceMs);

    return () => window.clearTimeout(t);
  }, [debounceMs, isComposing, pathname, router, searchParams, value]);

  return (
    <div>
      <label className="sr-only" htmlFor={`q-${listId}`}>
        검색
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--muted)]"
          aria-hidden="true"
        />
        <Input
          id={`q-${listId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            setValue(e.currentTarget.value);
          }}
          placeholder="표기/뜻으로 검색…"
          maxLength={50}
          autoComplete="off"
          className="pl-10 pr-11"
        />
        {value.trim().length > 0 ? (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setValue("")}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "inline-flex h-10 w-10 items-center justify-center",
              "bg-transparent text-[color:var(--muted)]",
              "hover:text-[color:var(--foreground)]"
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

