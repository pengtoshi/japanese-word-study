"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/BottomSheet";

export type BottomSheetSelectOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
};

export function BottomSheetSelect<T extends string>({
  name,
  value,
  onValueChange,
  options,
  placeholder = "선택",
  sheetTitle = "선택",
  disabled,
  className,
  buttonClassName,
  contentClassName,
}: {
  name?: string;
  value: T | "";
  onValueChange: (next: T) => void;
  options: Array<BottomSheetSelectOption<T>>;
  placeholder?: string;
  sheetTitle?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div className={className}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <BottomSheet.Root open={open} onOpenChange={setOpen}>
        <BottomSheet.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "h-11 w-full rounded-xl px-3",
              "border border-[color:var(--border)] bg-[color:var(--surface)]",
              "shadow-[var(--shadow-card)]",
              "text-left text-sm font-semibold",
              "hover:bg-black/5 dark:hover:bg-white/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30",
              "disabled:opacity-60",
              buttonClassName
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                {selected ? (
                  <span className="truncate text-[color:var(--foreground)]">
                    {selected.label}
                  </span>
                ) : (
                  <span className="truncate text-[color:var(--muted)]">
                    {placeholder}
                  </span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--muted)]" />
            </span>
          </button>
        </BottomSheet.Trigger>

        <BottomSheet.Content className={contentClassName} srTitle={String(sheetTitle)}>
          <div className="pb-4 pt-2">
            <BottomSheet.Title className="text-base font-semibold tracking-tight text-[color:var(--foreground)]">
              {sheetTitle}
            </BottomSheet.Title>
          </div>

          <div className="max-h-[60vh] overflow-auto pb-2">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-2xl px-3 py-3 text-left",
                    "border border-transparent",
                    "transition-colors",
                    "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "truncate text-sm font-semibold",
                          isSelected
                            ? "text-[color:var(--accent)]"
                            : "text-black/70 dark:text-white/70"
                        )}
                      >
                        {opt.label}
                      </div>
                      {opt.description ? (
                        <div className="mt-0.5 truncate text-xs text-black/50 dark:text-white/50">
                          {opt.description}
                        </div>
                      ) : null}
                    </div>

                    {isSelected ? (
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full",
                          "bg-[color:var(--accent)] text-white"
                        )}
                        aria-label="선택됨"
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </BottomSheet.Content>
      </BottomSheet.Root>
    </div>
  );
}

