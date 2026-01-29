import { cn } from "@/lib/utils";

type Tone = "danger" | "info";

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-[color:var(--border)] bg-black/5 text-[color:var(--foreground)] dark:bg-white/10",
        className
      )}
    >
      {children}
    </div>
  );
}
