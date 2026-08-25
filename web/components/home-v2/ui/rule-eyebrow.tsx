import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RuleEyebrowTone = "indigo" | "brass";

/**
 * The v2 section signature: a short hairline, then a tracked uppercase label.
 *
 * Deliberately separate from `components/ui/eyebrow.tsx` rather than an added
 * tone on it. That one is mono-font with gold/rose/cream tones and is still
 * rendered by every un-migrated page; widening it to carry two typographic
 * systems at once is how a shared primitive turns into a switch statement.
 * When the migration finishes, this replaces it.
 */
const RULES: Record<RuleEyebrowTone, string> = {
  indigo: "bg-indigo",
  brass: "bg-brass-deep/70",
};

export function RuleEyebrow({
  children,
  tone = "indigo",
  align = "left",
  className,
}: {
  children: ReactNode;
  tone?: RuleEyebrowTone;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5",
        align === "center" && "justify-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-px w-[38px] shrink-0", RULES[tone])}
      />
      <p className="font-ui text-micro font-semibold uppercase text-graphite-mute">
        {children}
      </p>
    </div>
  );
}

/** The same label without the rule — for centred sections. */
export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-ui text-micro font-semibold uppercase text-graphite-mute",
        className,
      )}
    >
      {children}
    </p>
  );
}
