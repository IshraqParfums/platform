import type { ReactNode } from "react";
import type { ProductListSort } from "@ishraqparfums/shared";
import { ShopSearch } from "@/components/shop/shop-search";
import { ShopSortSelect } from "@/components/shop/shop-sort-select";

/**
 * Flip on to put search + sort back beside the masthead. Query params still
 * work while this is off; only the chrome is hidden.
 */
export const SHOP_FILTER_RAIL_VISIBLE = false;

/**
 * Catalogue index: title beside search/sort on md+; one tools row on the phone.
 */
export function ShopFilterRail({
  title,
  collection,
  q,
  sort,
}: {
  title: ReactNode;
  collection?: string;
  q?: string;
  sort: ProductListSort;
}) {
  if (!SHOP_FILTER_RAIL_VISIBLE) {
    return title;
  }

  return (
    <div className="border-b border-graphite/10 pb-4">
      <div className="flex flex-col gap-3.5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(16rem,1.1fr)] md:items-end md:gap-x-10 md:gap-y-0">
        {title}
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <ShopSearch q={q} collection={collection} sort={sort} />
          </div>
          <ShopSortSelect sort={sort} collection={collection} q={q} />
        </div>
      </div>
    </div>
  );
}
