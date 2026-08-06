import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { ShopCollectionFilters } from "@/components/shop/shop-collection-filters";
import { ShopSearch } from "@/components/shop/shop-search";
import { ShopSortSelect } from "@/components/shop/shop-sort-select";

/**
 * Shop filter band.
 * Mobile: search-led, airy, scrollable collection chips — not a compressed toolbar.
 * Desktop: keeps the existing bordered control group.
 */
export function ShopToolbar({
  homepageCollections,
  totalCollectionCount,
  collection,
  q,
  sort,
}: {
  homepageCollections: CollectionSummary[];
  totalCollectionCount: number;
  collection?: string;
  q?: string;
  sort: ProductListSort;
}) {
  return (
    <div className="space-y-5 md:space-y-3 md:rounded-2xl md:border md:border-line/70 md:bg-card/40 md:px-5 md:pt-4 md:pb-3.5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
        <div className="order-1 min-w-0 w-full flex-1 md:order-2">
          <ShopSearch q={q} collection={collection} sort={sort} />
        </div>
        <div className="order-2 w-full md:order-1 md:w-auto">
          <ShopSortSelect sort={sort} collection={collection} q={q} />
        </div>
      </div>

      <ShopCollectionFilters
        homepageCollections={homepageCollections}
        totalCollectionCount={totalCollectionCount}
        collection={collection}
        q={q}
        sort={sort}
      />
    </div>
  );
}
