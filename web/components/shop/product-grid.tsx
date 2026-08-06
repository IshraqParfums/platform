import type { CollectionSummary, ProductListItem } from "@ishraqparfums/shared";
import { ProductCard } from "@/components/product/product-card";
import { OrnamentalDivider } from "@/components/ui/ornamental-divider";
import { Reveal } from "@/components/ui/reveal";

/**
 * Pure grid — no data fetching, no pagination, no empty-state handling.
 *
 * Mobile: single-column editorial catalogue with generous vertical rhythm.
 * Desktop: multi-column grid with hover-led cards.
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
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-10">
      {products.map((product, i) => {
        const isLast = i === products.length - 1;
        return (
          <div key={product.slug} className="flex min-w-0 flex-col">
            <Reveal delay={i * 60} className="min-h-0 sm:h-full">
              <ProductCard
                product={product}
                collectionLabel={labels.get(product.collectionSlug)}
                priority={i < 4}
              />
            </Reveal>
            {!isLast ? (
              <div
                className="flex shrink-0 items-center justify-center bg-cream pt-6 pb-1 sm:hidden"
                aria-hidden="true"
              >
                <OrnamentalDivider />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
