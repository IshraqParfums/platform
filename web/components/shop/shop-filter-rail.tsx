import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { ShopCollectionFilters } from "@/components/shop/shop-collection-filters";
import { ShopSearch } from "@/components/shop/shop-search";
import { ShopSortSelect } from "@/components/shop/shop-sort-select";

/**
 * Shop filter rail — search-led, sort secondary; collection chips scroll on mobile.
 * Scrolls with the page (not sticky) so it doesn't eat the product viewport.
 */
export function ShopFilterRail({
  homepageCollections,
  activeCollection,
  totalCollectionCount,
  collection,
  q,
  sort,
}: {
  homepageCollections: CollectionSummary[];
  activeCollection?: CollectionSummary;
  totalCollectionCount: number;
  collection?: string;
  q?: string;
  sort: ProductListSort;
}) {
  return (
    <div className="-mx-5 border-b border-line/50 bg-cream/92 px-5 py-4 sm:-mx-8 sm:px-8 md:py-3.5">
      <div className="flex flex-col gap-4 md:gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <ShopSearch q={q} collection={collection} sort={sort} />
          </div>
          <div className="w-full sm:w-auto sm:shrink-0">
            <ShopSortSelect sort={sort} collection={collection} q={q} />
          </div>
        </div>

        <ShopCollectionFilters
          homepageCollections={homepageCollections}
          activeCollection={activeCollection}
          totalCollectionCount={totalCollectionCount}
          collection={collection}
          q={q}
          sort={sort}
        />
      </div>
    </div>
  );
}
