import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A single corner mark: two hairlines meeting, with a small diagonal accent.
 * Deliberately thin and open — heavier heraldic corners would fight the
 * hairline rules used everywhere else on the site.
 */
function Corner({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("absolute h-[22px] w-[22px]", className)}
    >
      <path d="M1 8V1h7" />
      <path d="M1 13.5V16" opacity="0.55" />
      <path d="M13.5 1H16" opacity="0.55" />
      <path d="M4.6 4.6l3.1 3.1" opacity="0.7" />
    </svg>
  );
}

/**
 * Double-rule frame with corner ornaments. The outer edge is the element's own
 * border; the inner rule is inset, which is what gives the "pressed label"
 * feel without adding weight.
 */
export function OrnateFrame({
  children,
  className,
  inset = 8,
  tone = "gold",
}: {
  children: ReactNode;
  className?: string;
  /** Distance of the inner rule from the outer edge, in px. */
  inset?: number;
  tone?: "gold" | "cream";
}) {
  const color = tone === "gold" ? "text-gold/65" : "text-cream/45";

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0", color)}
      >
        <div
          className="absolute rounded-[inherit] border border-current opacity-90"
          style={{ inset }}
        />
        <Corner className="left-1 top-1" />
        <Corner className="right-1 top-1 -scale-x-100" />
        <Corner className="bottom-1 left-1 -scale-y-100" />
        <Corner className="bottom-1 right-1 -scale-100" />
      </div>

      {children}
    </div>
  );
}
