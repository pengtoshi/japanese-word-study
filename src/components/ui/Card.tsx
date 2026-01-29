import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      className={cn(
        "rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]",
        "shadow-[var(--shadow-card)]",
        "px-4 py-4 sm:px-6 sm:py-6",
        className
      )}
    >
      {children}
    </section>
  );
}
