import { PDP_TRUST } from "@/lib/content/pdp-trust";

/**
 * One quiet line under the CTA — never a badge row.
 *
 * The homepage cut its trust strip because brand claims live in Materials
 * and Belief. Shipping and checkout facts belong next to the purchase
 * decision instead. Text only, mid-dot separated, same copy on every bottle.
 */
export function ProductTrustLine() {
  return (
    <p className="text-[14px] leading-[1.6] text-graphite-soft">
      {PDP_TRUST.map((item, index) => (
        <span key={item}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}
