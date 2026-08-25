import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type UrduTone = "brass" | "brass-deep" | "on-dark";
export type UrduSize = "sm" | "md" | "lg" | "display";
export type UrduAlign = "start" | "center" | "end";

/**
 * Every Urdu string on the page goes through here, for two reasons.
 *
 * The first is correctness. Nastaliq needs `dir="rtl"` and `lang="ur"` to shape
 * and order properly — without them a browser will still *draw* the glyphs, but
 * a mixed Latin/Urdu line (a product card, where the English name sits on the
 * same row) can order its runs wrongly, and font fallback can pick a Naskh face
 * that renders the letters unjoined. The design prototype set neither.
 *
 * The second is vertical rhythm. Nastaliq's ascenders and descenders run far
 * outside a Latin line box, so it needs ~1.9 leading and a little top padding or
 * the dots on the upper letterforms are clipped by whatever sits above. That
 * lives on `.urdu` in globals.css and is applied here so no call site has to
 * remember it.
 *
 * Colour goes through `tone`, never `className` — `cn()` is a plain join with
 * no Tailwind conflict resolution, so a `text-*` passed in from outside would
 * sit alongside these rather than replace them and the cascade would pick the
 * winner. Same trap `Eyebrow` documents.
 */
const TONES: Record<UrduTone, string> = {
  brass: "text-brass",
  "brass-deep": "text-brass-deep",
  // On the espresso footer, where brass is too dark to read.
  "on-dark": "text-[#c9a259]",
};

/**
 * `dir="rtl"` is required for shaping and bidi, but it also flips the default
 * text-align to the right — which is why an Urdu line above a left-aligned
 * English heading drifts to the far edge of the column and reads as unrelated
 * to it. Direction and alignment are separate concerns: the text still runs
 * right-to-left internally, it just starts flush with the heading it belongs to.
 * Alignment is therefore explicit at every call site rather than inherited.
 */
const ALIGNMENTS: Record<UrduAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

const SIZES: Record<UrduSize, string> = {
  sm: "text-[15px]",
  md: "text-[19px] sm:text-[21px]",
  lg: "text-[22px] sm:text-[25px]",
  display: "text-[28px] sm:text-[38px] lg:text-[52px]",
};

export function Urdu({
  children,
  tone = "brass",
  size = "md",
  align = "start",
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  tone?: UrduTone;
  size?: UrduSize;
  /** Where the line sits in its box — not which way the script runs. */
  align?: UrduAlign;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  return (
    <Tag
      dir="rtl"
      lang="ur"
      className={cn(
        "urdu",
        TONES[tone],
        SIZES[size],
        ALIGNMENTS[align],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
