import { cn } from "@/lib/utils";

export function JlptPill({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  const text = String(level).toUpperCase().replace("JLPT", "").trim();
  const dotClass =
    text === "N1"
      ? "bg-purple-500"
      : text === "N2"
      ? "bg-blue-500"
      : text === "N3"
      ? "bg-emerald-500"
      : text === "N4"
      ? "bg-amber-400"
      : text === "N5"
      ? "bg-red-500"
      : "bg-(--accent)";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full",
        "border border-(--border) bg-(--surface)",
        "px-2.5 py-1 text-xs font-semibold",
        "shadow-(--shadow-card)",
        className
      )}
      aria-label={`문제 생성 난이도 ${text}`}
      title={`난이도 ${text}`}
    >
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClass)} />
      <span className="tracking-tight">{text}</span>
    </span>
  );
}

