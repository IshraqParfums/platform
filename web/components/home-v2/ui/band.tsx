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

export function BandInner({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
