import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EyebrowTone = "rose" | "gold" | "cream";

/**
 * Colour belongs to `tone`, never to `className`.
 *
 * This previously hardcoded `text-rose-deep` in its base classes while also
 * accepting a colour override. `cn()` is a plain join with no Tailwind conflict
 * resolution, so both classes landed on the element and the cascade — not the
 * JSX — picked the winner. Tailwind emits `text-rose-deep` after both
 * `text-cream-soft` and `text-gold-soft`, so every overridden eyebrow on the
 * site silently rendered brick red: ~1.7:1 against bright smoke in the hero.
 */
const TONES: Record<EyebrowTone, string> = {
  rose: "text-rose-deep",
  gold: "text-gold-soft",
  cream: "text-cream-soft",
};

/** Small mono label used above headings — the editorial signature of the brand. */
export function Eyebrow({
  children,
  className,
  tone = "rose",
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  /** Use this rather than a colour utility in `className`. */
  tone?: EyebrowTone;
  as?: "p" | "span" | "div";
}) {
  return (
    <Tag
      className={cn("font-mono text-label uppercase", TONES[tone], className)}
    >
      {children}
    </Tag>
  );
}
