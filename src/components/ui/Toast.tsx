"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type ToastType = "success" | "error" | "info";

export type ToastProps = {
  id: string | number;
  title: React.ReactNode;
  type?: ToastType;
  description?: React.ReactNode;
  button?: {
    label: string;
    onClick: () => void;
  };
  showIcon?: boolean;
  className?: string;
};

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toneClassMap: Record<ToastType, string> = {
  success: "text-emerald-700 dark:text-emerald-400",
  error: "text-rose-700 dark:text-rose-400",
  info: "text-[color:var(--foreground)]",
};

export function Toast({
  id,
  title,
  type = "info",
  description,
  button,
  showIcon = true,
  className,
}: ToastProps) {
  const Icon = iconMap[type];

  return (
    <div
      className={cn(
        "flex w-[360px] max-w-[calc(100vw-24px)] items-start justify-between gap-3",
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]",
        "px-4 py-3 shadow-[var(--shadow-float)]",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {showIcon ? (
          <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", toneClassMap[type])} />
        ) : null}

        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", toneClassMap[type])}>
            {title}
          </p>
          {description ? (
            <p className="mt-0.5 max-h-10 overflow-hidden text-ellipsis text-xs text-[color:var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {button ? (
        <Button
          size="sm"
          className="h-9 shrink-0 px-3"
          variant="secondary"
          onClick={() => {
            button.onClick();
            sonnerToast.dismiss(id);
          }}
        >
          {button.label}
        </Button>
      ) : null}
    </div>
  );
}

