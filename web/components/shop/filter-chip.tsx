import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Outline / gold-fill chip for catalog filters. Colours stay locked here —
 * pass layout utilities via `className`, not colour overrides.
 */
export function FilterChip({
  active,
  children,
  className,
  ...props
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors duration-200",
        active
          ? "border-gold/55 bg-gold-soft/85 text-deep"
          : "border-ink/20 bg-transparent text-ink-soft hover:border-ink/40 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
