import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BandTone = "paper" | "paper-deep" | "shell" | "dark" | "none";

/**
 * Vertical rhythm and gutter for the v2 home page, and nowhere else.
 *
 * Separate from `components/ui/section.tsx` on purpose: that component owns the
 * spacing of every page still on the old design, and nudging its scale to suit
 * this page would move /shop, the PDP and checkout underneath us. Two rhythm
 * authorities is the cost of migrating one page at a time; it goes away when
 * the last page moves across.
 *
 * `tone="none"` leaves the drifting field showing through, which is the default
 * look — an opaque fill is the exception, used where a band needs to separate
 * itself from its neighbours.
 */
const TONES: Record<BandTone, string> = {
  none: "",
  paper: "bg-paper",
  "paper-deep": "bg-paper-deep border-t border-graphite/8",
  shell: "bg-shell",
  dark: "bg-graphite text-shell",
};

const SPACE = {
  none: "",
  compact: "py-14 md:py-[70px]",
  default: "py-20 md:py-[110px]",
  spacious: "py-24 md:py-[120px] lg:py-[130px]",
} as const;

export function Band({
  children,
  tone = "none",
  space = "default",
  bordered = false,
  className,
  id,
}: {
  children: ReactNode;
  tone?: BandTone;
  space?: keyof typeof SPACE;
  /** Hairline rules top and bottom — for thin interstitial bands. */
  bordered?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative z-[1]",
        TONES[tone],
        SPACE[space],
        bordered && "border-y border-graphite/8",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * The page's one width authority. 1280px content column with gutters that hold
 * at every breakpoint the prototype never defined.
 */
export function BandInner({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10", className)}
    >
      {children}
    </div>
  );
}
