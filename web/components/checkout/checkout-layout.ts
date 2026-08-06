/**
 * Checkout is one column of numbered steps, not a form beside a sidebar.
 *
 * The page holds three short things — who you are, where it goes, what you pay.
 * Split into two columns, the shorter one runs out and leaves a void, and the
 * summary gets a rail too narrow for its own content. Stacked, each step owns
 * the full width, the order reads top to bottom, and the same structure serves
 * every breakpoint — so there is one layout to maintain, not two.
 *
 * Consume these tokens instead of hardcoding spacing per module.
 */
export const checkoutLayout = {
  /** Steps are separated by hairlines; the rule above the first closes the header. */
  sectionStack: "mt-8 border-t border-ink/[0.08] divide-y divide-ink/[0.08]",
  section: "py-7 last:pb-0 sm:py-9",
  sectionToContent: "mt-5",

  /** Saved addresses. A lone address takes the full width rather than half a row. */
  addressGrid: "grid gap-3",
  addressGridMulti: "md:grid-cols-2",
  addressCard: "px-5 py-4",

  /** The closing panel: what you are buying beside what you owe. */
  panel: "rounded-xl border border-ink/12 bg-cream-soft/70 p-5 sm:p-6",
  panelSplit:
    "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] md:gap-6",
  panelAside:
    "border-t border-ink/[0.08] pt-6 md:border-t-0 md:border-l md:border-ink/10 md:pt-0 md:pl-6",

  fieldGrid: "gap-3",
  fieldStack: "space-y-3",
  labelToControl: "mt-1.5",

  /**
   * Settled facts (name / email / phone): label over value, content-width so
   * columns hug the text instead of stretching across the section.
   */
  factRecord:
    "grid w-fit max-w-full grid-cols-1 gap-4 text-[15px] leading-relaxed sm:auto-cols-max sm:grid-flow-col sm:gap-x-10 sm:gap-y-0",
  factLabel: "font-mono text-label-sm uppercase text-ink-faint",
  factValue: "mt-1.5",

  /** The one motion curve checkout uses, matching `--ease-out-soft`. */
  ease: "ease-[cubic-bezier(0.22,0.8,0.28,1)]",
} as const;
