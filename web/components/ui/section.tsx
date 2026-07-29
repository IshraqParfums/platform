import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionTone = "cream" | "cream-soft" | "deep" | "deep-deeper";
export type SectionSpace = "compact" | "default" | "spacious";

const TONES: Record<SectionTone, string> = {
  cream: "bg-cream text-ink",
  "cream-soft": "bg-cream-soft text-ink",
  deep: "grain bg-deep text-cream",
  "deep-deeper": "grain bg-deep-deeper text-cream",
};

/**
 * The page's vertical rhythm lives here and nowhere else. Every band on the
 * site picks one of these three, so spacing can never drift per-section again.
 */
const SPACE: Record<SectionSpace, string> = {
  compact: "py-10 md:py-14",
  default: "py-16 md:py-24 lg:py-28",
  spacious: "py-20 md:py-28 lg:py-32",
};

export function Section({
  children,
  tone = "cream",
  space = "default",
  glow = false,
  bordered = false,
  className,
  id,
}: {
  children: ReactNode;
  tone?: SectionTone;
  space?: SectionSpace;
  /** Warm key light for espresso surfaces. */
  glow?: boolean;
  /** Hairline rules top and bottom — for thin interstitial bands. */
  bordered?: boolean;
  className?: string;
  id?: string;
}) {
  const isDark = tone === "deep" || tone === "deep-deeper";

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden",
        TONES[tone],
        SPACE[space],
        bordered && (isDark ? "border-y border-gold/12" : "border-y border-line/50"),
        className,
      )}
    >
      {glow && (
        <div
          aria-hidden="true"
          className="glow-gold pointer-events-none absolute inset-x-0 top-0 h-[78%]"
        />
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
