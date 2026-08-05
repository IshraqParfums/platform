import { cn } from "@/lib/cn";

/**
 * Luxury collection tag over product media. Colours locked — layout only via
 * `className`.
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
        "absolute left-3 top-3 rounded-full border border-gold/40 bg-deep/82 px-3 py-1.5 font-mono text-label-sm uppercase tracking-[0.14em] text-gold-soft backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
