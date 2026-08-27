/**
 * Banner for non-buyable states.
 *
 * Copy stays exactly as v1 wrote it: commerce clarity outranks house voice
 * here, and a stock warning is the one place on this page that should read
 * as plainly as possible. Only the surface is v2.
 */
export function ProductUnavailableNotice({
  availability,
}: {
  availability: "OUT_OF_STOCK" | "UNAVAILABLE";
}) {
  if (availability === "UNAVAILABLE") {
    return (
      <div className="border border-graphite/15 bg-shell px-5 py-5">
        <p className="font-editorial text-[19px] text-graphite">
          Temporarily unavailable
        </p>
        <p className="mt-2 text-[16px] leading-[1.6] text-graphite">
          This fragrance isn&apos;t for sale right now. You can still view the
          sizes and details below — check back soon, or explore other scents in
          the shop.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-graphite/15 bg-shell px-5 py-5">
      <p className="font-editorial text-[19px] text-graphite">Out of stock</p>
      <p className="mt-2 text-[16px] leading-[1.6] text-graphite">
        Every size is sold out at the moment. Size options below stay visible so
        you can see what&apos;s usually offered — none can be added to cart until
        stock returns.
      </p>
    </div>
  );
}
