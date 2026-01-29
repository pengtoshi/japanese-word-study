import { cn } from "@/utils/cn";

export function MobilePage({
  title,
  description,
  right,
  children,
}: {
  title?: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      {(title || description || right) && (
        <header className={cn("flex items-start justify-between gap-4")}>
          <div className="min-w-0">
            {title ? (
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
      )}

      {children}
    </section>
  );
}
