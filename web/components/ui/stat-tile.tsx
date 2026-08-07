import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  sublabel,
  className,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ink/10 bg-card px-5 py-4",
        className,
      )}
    >
      <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">
        {value}
      </p>
      {sublabel ? (
        <div className="mt-1 text-[13px] text-ink-faint">{sublabel}</div>
      ) : null}
    </div>
  );
}
