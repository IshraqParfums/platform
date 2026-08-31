import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BandTone = "paper" | "paper-deep" | "shell" | "dark" | "none";

const TONES: Record<BandTone, string> = {
  none: "",
  paper: "bg-paper",
  "paper-deep": "bg-paper-deep",
  shell: "bg-shell",
  dark: "bg-tobacco text-paper",
};

const SPACE = {
  none: "",
  compact: "py-14 md:py-16",
  default: "py-20 md:py-28",
  spacious: "py-24 md:py-36",
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
        bordered && "border-y border-graphite/10",
        className,
      )}
    >
      {children}
    </section>
  );
}

const INNER_WIDTH = {
  /** The shop width every existing `BandInner` call site was built for. */
  default: "max-w-[1320px]",
  /**
   * A single task-focused column — checkout, and now account. Narrower than
   * `default` so one column of steps or facts doesn't stretch into a page
   * with a hole in it (the same reasoning the old v1 `Container size="form"`
   * documented).
   */
  form: "max-w-[64rem]",
} as const;

export function BandInner({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: keyof typeof INNER_WIDTH;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        INNER_WIDTH[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
