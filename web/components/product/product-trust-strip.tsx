import { PDP_TRUST } from "@/lib/content/pdp-trust";

/**
 * Compact PDP assurances under the primary CTA — text-only rows, no icons.
 * Same store-wide copy as the v2 trust line.
 */
export function ProductTrustStrip() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1">
      {PDP_TRUST.map((label) => (
        <li
          key={label}
          className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
