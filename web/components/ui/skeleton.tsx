import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Content placeholders while a page or section loads.
 *
 * Conventions:
 * - Content wait → page/feature skeleton built from these primitives
 * - Action wait → button label pending (Sending…), not a skeleton
 * - Soft reloads (`useGuardedLoad`) → do not flash a skeleton after mutations
 *
 * Shape blocks to the UI that will land so nothing jumps. Reduced-motion
 * stills the pulse/shimmer globally; the blocks still read.
 */
export function Skeleton({
  className,
  rounded = "sm",
  variant = "pulse",
  style,
}: {
  className?: string;
  rounded?: "sm" | "lg" | "full";
  /** `shimmer` = soft left→right light pass; `pulse` = opacity pulse. */
  variant?: "pulse" | "shimmer";
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        variant === "shimmer" ? "skeleton-shimmer" : "animate-pulse bg-ink/[0.06]",
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
 * Vertical stack of skeleton bars — headers, summary rows, short copy.
 */
export function SkeletonStack({
  children,
  className,
  gap = "md",
}: {
  children: ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        gap === "sm" && "gap-2",
        gap === "md" && "gap-3",
        gap === "lg" && "gap-4",
        className,
      )}
    >
      {children}
    </div>
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
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
