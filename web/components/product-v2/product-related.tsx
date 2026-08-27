import type { ProductListItem } from "@ishraqparfums/shared";
import { ProductCard } from "@/components/product/product-card";

/**
 * Cross-sell row under the PDP — same collection + other collections.
 * Ported from product/product-related.tsx: the shared `ProductCard` (used on
 * `/shop` too) stays untouched and imported from its current location; only
 * the `SectionHeading` usage above it is swapped for the inline kicker +
 * heading pattern used across the v2 homepage.
 */
export function ProductRelated({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="more-to-explore-heading">
      <p className="text-[13px] text-terra">Continue exploring</p>
      <h2
        id="more-to-explore-heading"
        className="mt-3 font-editorial text-h3-editorial text-graphite"
      >
        More to explore
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6">
        {products.map((product, index) => (
          <ProductCard
            key={product.slug}
            product={product}
            priority={index < 2}
          />
        ))}
      </div>
    </section>
  );
}
