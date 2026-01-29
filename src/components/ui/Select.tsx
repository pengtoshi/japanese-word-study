"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function Select({
  name,
  value,
  onValueChange,
  options,
  placeholder = "선택해 주세요",
  disabled = false,
  className,
  buttonClassName,
  menuClassName,
}: {
  name?: string;
  value: string;
  onValueChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const pointerSelectedRef = React.useRef(false);

  const selected = React.useMemo(() => {
    return options.find((o) => o.value === value) ?? null;
  }, [options, value]);

  React.useEffect(() => {
    function onPointerDownCapture(e: PointerEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    // Use capture so it still works even if some parent stops propagation
    // (e.g. overlay/sheet implementations).
    window.addEventListener("pointerdown", onPointerDownCapture, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDownCapture, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "h-11 w-full rounded-xl px-3",
          "border border-(--border) bg-(--surface)",
          "text-left text-sm font-semibold",
          "flex items-center justify-between gap-2",
          "hover:bg-black/5 dark:hover:bg-white/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={cn(!selected ? "text-(--muted)" : undefined)}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-(--muted) transition-transform",
            open ? "rotate-180" : undefined
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="선택"
          className={cn(
            "absolute left-0 right-0 top-full z-50",
            "rounded-2xl border border-(--border) bg-(--surface)",
            "p-1 max-h-64 overflow-auto",
            menuClassName
          )}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={disabled || o.disabled}
                  onPointerDown={(e) => {
                    // Pointer selection should close immediately.
                    // Prevent the subsequent click from double-firing onValueChange.
                    e.preventDefault();
                    pointerSelectedRef.current = true;
                    onValueChange(o.value);
                    setOpen(false);
                  }}
                  onClick={() => {
                    // Keyboard activation triggers click, not pointerdown.
                    if (pointerSelectedRef.current) {
                      pointerSelectedRef.current = false;
                      return;
                    }
                    onValueChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm",
                    "hover:bg-black/5 dark:hover:bg-white/10",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isSelected ? "bg-black/5 dark:bg-white/10" : undefined
                  )}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

