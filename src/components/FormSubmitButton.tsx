"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full",
        "border-2 border-black/15 border-t-black/55",
        "dark:border-white/15 dark:border-t-white/70",
        className
      )}
    />
  );
}

export function FormSubmitButton({
  children,
  disabled,
  className,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & {
  pendingText?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      disabled={Boolean(disabled) || pending}
      className={cn("gap-2", className)}
      aria-busy={pending || undefined}
    >
      {pending ? <Spinner /> : null}
      <span>{pending && pendingText ? pendingText : children}</span>
    </Button>
  );
}

