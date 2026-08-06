import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Widths belong to `size`, never to a `max-w-*` passed through `className` —
 * `cn()` is a plain join, so two max-widths would both land on the element and
 * the cascade, not the call site, would decide. Add a size instead.
 *
 * `form` sits between `narrow` and `default`: wide enough for two cards abreast
 * or a receipt split in two, narrow enough that a single task-focused column
 * still reads as one column rather than a page with a hole in it.
 */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow" | "form";
}) {
  const width =
    size === "wide"
      ? "max-w-[1400px]"
      : size === "narrow"
        ? "max-w-3xl"
        : size === "form"
          ? "max-w-[64rem]"
          : "max-w-[1200px]";

  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", width, className)}>
      {children}
    </div>
  );
}
