const DEFAULT_ITEMS = [
  "Secure checkout",
  "₹50 delivery",
  "7-day support",
] as const;

/**
 * Compact PDP assurances under the primary CTA — text-only rows, no icons.
 * Ported from product/product-trust-strip.tsx: drops the lucide icons and
 * takes real product `claims` when present, falling back to the same three
 * defaults the v1 strip hardcoded.
 */
export function ProductTrustStrip({
  claims,
}: {
  claims?: string[] | null;
}) {
  const items = claims && claims.length > 0 ? claims : DEFAULT_ITEMS;

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1">
      {items.map((label, index) => (
        <li
          key={`${label}-${index}`}
          className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
