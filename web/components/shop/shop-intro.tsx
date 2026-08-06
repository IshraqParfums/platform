/**
 * Quiet catalog masthead — orients the shopper without competing with products.
 * Mobile stacks title → editorial line → count for clearer rhythm.
 * Desktop keeps title and count on one baseline row.
 */
export function ShopIntro({ total }: { total: number }) {
  const countLabel = `${total} composition${total === 1 ? "" : "s"}`;

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
        <h1 className="font-display text-[clamp(1.75rem,5vw,1.85rem)] font-semibold tracking-tight text-ink md:text-[clamp(1.55rem,2.4vw,1.85rem)]">
          All Perfumes
        </h1>
        <p className="hidden shrink-0 font-mono text-label-sm uppercase tracking-wide text-ink-faint md:block">
          {countLabel}
        </p>
      </div>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft md:mt-1.5 md:text-[14px] md:leading-snug">
        Handcrafted compositions built from a real perfumer&apos;s palette.
      </p>
      <p className="mt-3 font-mono text-label-sm uppercase tracking-wide text-ink-faint md:hidden">
        {countLabel}
      </p>
    </div>
  );
}
