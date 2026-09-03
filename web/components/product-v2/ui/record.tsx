import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The one section kicker for the whole PDP.
 *
 * Previously this style was re-typed as a literal in a dozen files — always
 * `text-[11px] uppercase tracking-[0.14em] text-graphite-faint`, which
 * measures 2.8:1 on parchment and fails WCAG AA outright. It also drifted:
 * some kickers were `graphite-faint`, some `graphite-mute` (a difference of
 * about 8%, invisible in practice), and two were a completely different
 * plain 13px terra.
 *
 * Those last two were the correct ones — they match what the homepage
 * already does in `collection.tsx` and `bespoke-entry.tsx`. So the house
 * pattern wins: plain 13px terra, no uppercase, no tracking, 5.7:1. Defined
 * once here so it can't drift again.
 */
export function RecordKicker({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-terra">{children}</p>;
}

/**
 * A quiet label for a second block inside one section — e.g. "Keeping it"
 * under the wearing chapter. Deliberately not a kicker: two terra labels in
 * one section would read as two sections.
 */
export function RecordSubheading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-semibold text-graphite-soft">{children}</p>
  );
}

/**
 * One section of the record.
 *
 * The earlier version put a numbered `01 / THE NAME` in a fixed 150px left
 * gutter. It looked like a magazine, but on a page where sections come and
 * go with the data it read as a magazine *with chapters missing* — and the
 * gutter pushed content into a narrow column for no benefit. Gone.
 *
 * What's left is the homepage's own section shape: a terra kicker, an
 * optional support line, then content at full width. Sections constrain
 * their own prose measure; this doesn't impose one, because the blocks vary
 * (a notes list and a spec grid want different widths).
 */
export function RecordSection({
  kicker,
  support,
  children,
  className,
}: {
  /** Omit when the section's own title is already shown elsewhere — e.g. a
   *  chapter reused inside a menu row whose button label is the only title. */
  kicker?: string;
  /** One plain-English line under the kicker, for sections that need framing. */
  support?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      {kicker ? <RecordKicker>{kicker}</RecordKicker> : null}
      {support ? (
        <p
          className={cn(
            "max-w-[54ch] text-[16px] leading-[1.6] text-graphite-soft",
            kicker && "mt-3",
          )}
        >
          {support}
        </p>
      ) : null}
      <div className={kicker || support ? "mt-7" : undefined}>{children}</div>
    </section>
  );
}
