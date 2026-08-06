import { cn } from "@/lib/cn";

/**
 * Placeholder for content that is on its way — the same faint ink wash the
 * login page already uses for its suspense fallback, with a slow pulse.
 *
 * Shape these to the content that will land, so nothing jumps when it does.
 * The global reduced-motion rule stills the pulse; the blocks still read.
 */
export function Skeleton({
  className,
  rounded = "sm",
}: {
  className?: string;
  rounded?: "sm" | "lg" | "full";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-ink/[0.06]",
        rounded === "full"
          ? "rounded-full"
          : rounded === "lg"
            ? "rounded-lg"
            : "rounded-sm",
        className,
      )}
    />
  );
}

/**
 * Wrapper that announces the wait once, for assistive tech, while the blocks
 * inside stay decorative.
 */
export function SkeletonScreen({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
