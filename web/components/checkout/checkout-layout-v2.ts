/**
 * v2 checkout — spacing parity with `checkout-layout.ts`, recoloured for the
 * paper/graphite/terra surface. Forked rather than edited in place:
 * `checkout-layout.ts` is still read by the v1 account order-detail and
 * fact-record views, so its values can't move out from under them.
 */
export const checkoutLayoutV2 = {
  /** Steps are separated by hairlines; the rule above the first closes the header. */
  sectionStack: "mt-10 border-t border-graphite/10 divide-y divide-graphite/10",
  section: "py-8 last:pb-0 sm:py-10",
  sectionToContent: "mt-5",

  /** Saved addresses. A lone address takes the full width rather than half a row. */
  addressGrid: "grid gap-3",
  addressGridMulti: "md:grid-cols-2",
  addressCard: "px-5 py-4",

  /** The closing panel: what you are buying beside what you owe. */
  panel:
    "rounded-[4px] border border-graphite/10 bg-shell p-5 sm:p-6 shadow-[0_18px_44px_-30px_rgba(22,19,16,0.42)]",
  panelSplit:
    "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] md:gap-6",
  panelAside:
    "border-t border-graphite/10 pt-6 md:border-t-0 md:border-l md:border-graphite/10 md:pt-0 md:pl-6",

  fieldGrid: "gap-3",
  fieldStack: "space-y-3",
  labelToControl: "mt-1.5",

  /** The one motion curve checkout uses, matching `--ease-out-soft`. */
  ease: "ease-[cubic-bezier(0.22,0.8,0.28,1)]",
} as const;
