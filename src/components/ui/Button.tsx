import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "ghost";
type Size = "default" | "sm";

export function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30",
        "disabled:pointer-events-none disabled:opacity-60",
        size === "default" ? "h-11 px-4" : "h-9 px-3",
        variant === "default"
          ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-rose-600"
          : variant === "destructive"
          ? "border border-[color:var(--border)] bg-[color:var(--surface)] text-red-700 hover:bg-red-50"
          : variant === "ghost"
          ? "bg-transparent text-[color:var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
          : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10",
        className
      )}
    />
  );
}
