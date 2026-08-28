import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Outline / gold-fill chip for catalog filters. Colours stay locked here —
 * pass layout utilities via `className`, not colour overrides.
 *
 * `paper` is the v2 shop rail (terra on parchment). Default stays gold for
 * the v1 purchase panel, which still mounts this chip.
 */
export function FilterChip({
  active,
  tone = "gold",
  children,
  className,
  ...props
}: {
  active?: boolean;
  tone?: "gold" | "paper";
  children: ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors duration-200",
        tone === "paper"
          ? active
            ? "border-terra bg-terra text-paper"
            : "border-graphite/20 bg-transparent text-graphite-soft hover:border-graphite/40 hover:text-graphite"
          : active
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
