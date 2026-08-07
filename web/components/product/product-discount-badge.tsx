import { cn } from "@/lib/cn";

/**
 * Quiet sale marker over product media. Colours locked — layout only via
 * `className`. Shows `{n}%` only; the price line already carries "off".
 * Positioning belongs to the media badge row, not this pill.
 */
export function ProductDiscountBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-gold/35 bg-deep/82 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold-soft backdrop-blur-sm",
        className,
      )}
    >
      {percent}%
    </span>
  );
}
