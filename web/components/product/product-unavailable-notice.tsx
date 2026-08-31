/**
 * Banner for non-buyable PDP states. Wishlist CTA can plug in here later.
 * Ported from product/product-unavailable-notice.tsx, retinted.
 */
export function ProductUnavailableNotice({
  availability,
}: {
  availability: "OUT_OF_STOCK" | "UNAVAILABLE";
}) {
  if (availability === "UNAVAILABLE") {
    return (
      <div className="rounded-xl border border-graphite/15 bg-shell px-5 py-5">
        <p className="font-editorial text-lg text-graphite">
          Temporarily unavailable
        </p>
        <p className="mt-2 text-sm leading-relaxed text-graphite-soft">
          This fragrance isn&apos;t for sale right now. You can still view the
          sizes and details below. Check back soon, or explore other scents in
          the shop.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-graphite/15 bg-shell px-5 py-5">
      <p className="font-editorial text-lg text-graphite">Out of stock</p>
      <p className="mt-2 text-sm leading-relaxed text-graphite-soft">
        Every size is sold out at the moment. Size options below stay visible so
        you can see what&apos;s usually offered, but none can be added to cart until
        stock returns.
      </p>
    </div>
  );
}
