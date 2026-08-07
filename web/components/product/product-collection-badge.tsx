import { cn } from "@/lib/cn";

/**
 * Luxury collection tag over product media. Colours locked — layout only via
 * `className`. Positioning belongs to the media badge row, not this pill.
 * Inner span carries truncate so ellipsis works inside a flex pill.
 */
export function ProductCollectionBadge({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-full border border-gold/40 bg-deep/82 px-3.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold-soft backdrop-blur-sm",
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
