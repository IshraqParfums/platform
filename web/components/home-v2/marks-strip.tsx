import { Band, BandInner } from "@/components/home-v2/ui/band";
import { HOME_MARKS } from "@/lib/content/home-v2";

/**
 * The four trust marks, set as a hairline-ruled grid rather than an icon row.
 *
 * The prototype ran one four-column line with a divider after every cell, which
 * leaves a stray rule hanging off the right edge and has nothing to say below
 * 1000px. The rules here are derived from each cell's position at each of the
 * three layouts (1-up, 2-up, 4-up).
 *
 * Every class below is emitted at most once per side per breakpoint — a cell
 * never carries both `sm:border-t` and `sm:border-t-0`. That matters because
 * `cn()` is a plain string join with no Tailwind conflict resolution: two
 * competing classes in the same variant are resolved by stylesheet order rather
 * than by what this file intended, which is the trap `Eyebrow` and `Button`
 * both document. The rule is: turn a border ON at the breakpoint that needs it,
 * OFF at the next breakpoint that doesn't, and never restate it.
 */
function ruleClasses(index: number, total: number): string {
  const classes = ["border-graphite/8"];

  // Top rules separate stacked rows. 1-up: every cell but the first. 2-up: only
  // the second row (index 2, 3) — so index 1 turns its rule off at `sm`. 4-up:
  // one row, so 2 and 3 turn theirs off at `lg`.
  if (index > 0) classes.push("border-t");
  if (index === 1) classes.push("sm:border-t-0");
  if (index >= 2) classes.push("lg:border-t-0");

  // Right rules separate columns. 2-up: the left cell of each pair. 4-up: every
  // cell but the last — which adds only index 1, since 0 and 2 already carry it
  // from `sm` and the last cell must never have one.
  if (index % 2 === 0) classes.push("sm:border-r");
  if (index === 1 && total > 2) classes.push("lg:border-r");

  return classes.join(" ");
}

export function MarksStrip() {
  return (
    <Band space="none" bordered>
      <BandInner>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_MARKS.map((mark, i) => (
            <div
              key={mark.title}
              className={`py-5 sm:pr-7 lg:py-6 lg:pr-6 ${ruleClasses(i, HOME_MARKS.length)}`}
            >
              <p className="font-ui text-micro-sm font-semibold uppercase text-indigo">
                {mark.title}
              </p>
              <p className="mt-1.5 text-[15px] leading-[1.5] text-graphite-soft">
                {mark.body}
              </p>
            </div>
          ))}
        </div>
      </BandInner>
    </Band>
  );
}
