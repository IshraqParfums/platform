import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A band of light sweeping around the border ring. Pure CSS (see
 * `.shimmer-frame` in globals.css) — no JS, one composited gradient.
 *
 * Use it on at most one or two elements per page. The effect earns attention
 * precisely because it is rare; applied to every card it reads as wallpaper.
 */
export function ShimmerFrame({
  children,
  className,
  rounded = "rounded-3xl",
}: {
  children: ReactNode;
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={cn("shimmer-frame", rounded, className)}>{children}</div>
  );
}
