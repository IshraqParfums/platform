import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { ShopCollectionFilters } from "@/components/shop/shop-collection-filters";
import { ShopSearch } from "@/components/shop/shop-search";
import { ShopSortSelect } from "@/components/shop/shop-sort-select";

/**
 * One intentional filter band — sort, search, and collections stay grouped so
 * they don't float as separate chrome. Must render under ShopNavigationProvider.
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
    <div className="rounded-2xl border border-line/70 bg-card/40 px-4 pt-3.5 pb-3 sm:px-5 sm:pt-4 sm:pb-3.5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="order-2 w-full sm:order-1 sm:w-auto">
            <ShopSortSelect sort={sort} collection={collection} q={q} />
          </div>
          <div className="order-1 min-w-0 w-full flex-1 sm:order-2">
            <ShopSearch q={q} collection={collection} sort={sort} />
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
    </div>
  );
}
