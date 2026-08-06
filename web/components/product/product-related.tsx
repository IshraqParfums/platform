import type { ProductListItem } from "@ishraqparfums/shared";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Cross-sell row under the PDP — same collection + other collections.
 */
export function ProductRelated({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="more-to-explore-heading">
      <SectionHeading
        title={<span id="more-to-explore-heading">More to explore</span>}
      />
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6">
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
