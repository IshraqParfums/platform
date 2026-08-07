import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "gold" | "sage" | "rose";

const TONES: Record<Tone, string> = {
  neutral: "border-ink/12 bg-ink/[0.03] text-ink-soft",
  gold: "border-gold/40 bg-gold/10 text-gold-deeper",
  sage: "border-sage/40 bg-sage/10 text-sage",
  rose: "border-rose-deep/30 bg-rose-deep/10 text-rose-deep",
};

/** Small status pill for admin tables/detail pages — non-order statuses only, see OrderStatusChip for orders. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-label-sm uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
