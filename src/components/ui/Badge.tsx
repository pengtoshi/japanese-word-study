import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger";

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        variant === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : variant === "danger"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-zinc-200 bg-zinc-50 text-zinc-800",
        className
      )}
    >
      {children}
    </span>
  );
}
