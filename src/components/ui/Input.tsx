import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm",
        "outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    />
  );
});

Input.displayName = "Input";
