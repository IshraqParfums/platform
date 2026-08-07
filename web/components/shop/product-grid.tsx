import type { CollectionSummary, ProductListItem } from "@ishraqparfums/shared";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/ui/reveal";

/**
 * Pure grid — no data fetching, no pagination, no empty-state handling.
 *
 * Mobile: 2-column compact catalogue.
 * Desktop: 4-column grid with hover-led cards.
 */
export function ProductGrid({
  products,
  collections,
}: {
  products: ProductListItem[];
  collections: CollectionSummary[];
}) {
  const labels = new Map(collections.map((c) => [c.slug, c.name]));

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-12">
      {products.map((product, i) => (
        <Reveal
          key={product.slug}
          delay={Math.min(i, 7) * 50}
          className="min-h-0 h-full"
        >
          <ProductCard
            product={product}
            collectionLabel={labels.get(product.collectionSlug)}
            priority={i < 4}
            density="compact"
          />
        </Reveal>
      ))}
    </div>
  );
}
