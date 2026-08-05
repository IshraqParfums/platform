"use client";

import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { FilterChip } from "@/components/shop/filter-chip";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buildShopHref } from "@/lib/shop-query";

/**
 * Curated collection chips with soft navigation so the results grid can show
 * a shared pending state via ShopNavigationProvider.
 */
export function ShopCollectionFilters({
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
  const { navigate } = useShopNavigate();
  const hasFilters = Boolean(collection || q?.trim());
  const showBrowseAll = totalCollectionCount > homepageCollections.length;

  return (
    <div className="space-y-2">
      <Eyebrow>Browse by collection</Eyebrow>

      <div className="flex flex-wrap items-center gap-2">
        <ul className="flex flex-wrap gap-1.5" aria-label="Filter by collection">
          {homepageCollections.map((item) => {
            const active = collection === item.slug;
            return (
              <li key={item.slug}>
                <FilterChip
                  active={active}
                  onClick={() => {
                    navigate(
                      buildShopHref({
                        collection: active ? undefined : item.slug,
                        q,
                        sort,
                      }),
                    );
                  }}
                >
                  {item.name}
                </FilterChip>
              </li>
            );
          })}
        </ul>

        {showBrowseAll ? (
          <button
            type="button"
            className="cursor-pointer font-mono text-label-sm uppercase tracking-wide text-rose-deep transition-colors hover:text-ink"
            onClick={() => navigate("/collections")}
          >
            Browse all
            <span aria-hidden="true"> →</span>
          </button>
        ) : null}

        {hasFilters ? (
          <button
            type="button"
            className="ml-auto cursor-pointer text-[13px] font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
            onClick={() => navigate(buildShopHref({ sort }))}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
