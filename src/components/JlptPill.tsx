import { cn } from "@/lib/utils";

export function JlptPill({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  const text = String(level).toUpperCase().replace("JLPT", "").trim();
  // Expect: "N3" or "N1"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full",
        "border border-[color:var(--border)] bg-[color:var(--surface)]",
        "px-2.5 py-1 text-xs font-semibold",
        "shadow-[var(--shadow-card)]",
        className
      )}
      aria-label={`문제 생성 난이도 ${text}`}
      title={`난이도 ${text}`}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-[color:var(--accent)]"
      />
      <span className="tracking-tight">{text}</span>
    </span>
  );
}

