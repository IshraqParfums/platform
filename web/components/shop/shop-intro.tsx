/**
 * Quiet catalog masthead — orients the shopper without competing with products.
 * On mobile the count sits beside the title so it doesn’t orphan under the subtitle.
 */
export function ShopIntro({ total }: { total: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[clamp(1.55rem,2.4vw,1.85rem)] font-semibold tracking-tight text-ink">
          All Perfumes
        </h1>
        <p className="shrink-0 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          {total} composition{total === 1 ? "" : "s"}
        </p>
      </div>
      <p className="mt-1.5 max-w-md text-[14px] leading-snug text-ink-soft">
        Handcrafted compositions built from a real perfumer&apos;s palette.
      </p>
    </div>
  );
}
