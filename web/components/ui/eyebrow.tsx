import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small mono label used above headings — the editorial signature of the brand. */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  return (
    <Tag
      className={cn(
        "font-mono text-label uppercase text-rose-deep",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
