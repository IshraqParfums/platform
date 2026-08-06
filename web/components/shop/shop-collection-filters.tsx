"use client";

import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { FilterChip } from "@/components/shop/filter-chip";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buildShopHref } from "@/lib/shop-query";
import { cn } from "@/lib/cn";

/**
 * Curated collection chips.
 * Mobile: horizontal scroll catalogue strip.
 * Desktop: wrapping chip row inside the toolbar.
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
    <div className="space-y-3 md:space-y-2">
      <div className="flex items-end justify-between gap-3 px-0 md:px-0">
        <Eyebrow className="hidden md:block">Browse by collection</Eyebrow>
        <p className="font-mono text-label-sm uppercase tracking-[0.14em] text-ink-faint md:hidden">
          Collections
        </p>
        {hasFilters ? (
          <button
            type="button"
            className="cursor-pointer text-[13px] font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline md:hidden"
            onClick={() => navigate(buildShopHref({ sort }))}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "-mx-5 flex items-center gap-3 overflow-x-auto px-5 pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory",
          "md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 md:snap-none",
        )}
      >
        <ul
          className="flex min-w-0 flex-nowrap gap-2 md:flex-wrap"
          aria-label="Filter by collection"
        >
          {homepageCollections.map((item) => {
            const active = collection === item.slug;
            return (
              <li key={item.slug} className="shrink-0 snap-start">
                <FilterChip
                  active={active}
                  className="min-h-11 px-4 py-2.5 text-[14px] md:min-h-0 md:px-3 md:py-1.5 md:text-[13px]"
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
            className="shrink-0 cursor-pointer snap-start whitespace-nowrap py-2 font-mono text-label-sm uppercase tracking-wide text-rose-deep transition-colors hover:text-ink md:py-0"
            onClick={() => navigate("/collections")}
          >
            Browse all
            <span aria-hidden="true"> →</span>
          </button>
        ) : null}

        {hasFilters ? (
          <button
            type="button"
            className="ml-auto hidden cursor-pointer text-[13px] font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline md:inline"
            onClick={() => navigate(buildShopHref({ sort }))}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
