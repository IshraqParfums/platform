/**
 * Banner for non-buyable PDP states. Wishlist CTA can plug in here later.
 */
export function ProductUnavailableNotice({
  availability,
}: {
  availability: "OUT_OF_STOCK" | "UNAVAILABLE";
}) {
  if (availability === "UNAVAILABLE") {
    return (
      <div className="rounded-xl border border-ink/10 bg-cream-soft/60 px-5 py-5">
        <p className="font-display text-lg font-semibold text-ink">
          Temporarily unavailable
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          This fragrance isn&apos;t for sale right now. You can still view the
          sizes and details below — check back soon, or explore other scents in
          the shop.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-cream-soft/60 px-5 py-5">
      <p className="font-display text-lg font-semibold text-ink">Out of stock</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Every size is sold out at the moment. Size options below stay visible so
        you can see what&apos;s usually offered — none can be added to cart until
        stock returns.
      </p>
    </div>
  );
}
