"use client";

import type { CollectionSummary, ProductListSort } from "@ishraqparfums/shared";
import { FilterChip } from "@/components/shop/filter-chip";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { buildShopHref } from "@/lib/shop-query";
import { cn } from "@/lib/cn";

/**
 * Curated collection chips.
 * Homepage collections always show; if the active filter is off that list,
 * it is prepended so you can toggle it off and leave the filter.
 *
 * Mobile: chips scroll alone; Clear filters sits on the row below so they
 * never overlap. Desktop: Clear stays on the chip row (ml-auto).
 */
export function ShopCollectionFilters({
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
  const { navigate } = useShopNavigate();
  const hasFilters = Boolean(collection || q?.trim());
  const showAllCollections =
    totalCollectionCount > homepageCollections.length;

  const chips: CollectionSummary[] = (() => {
    if (
      activeCollection &&
      !homepageCollections.some((item) => item.slug === activeCollection.slug)
    ) {
      return [activeCollection, ...homepageCollections];
    }
    return homepageCollections;
  })();

  function clearFilters() {
    navigate(buildShopHref({ sort }));
  }

  const clearButtonClassName =
    "shrink-0 cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink/35 hover:text-ink";

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={cn(
          "-mx-5 flex items-center gap-3 overflow-x-auto px-5 pb-0.5",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory",
          "md:mx-0 md:overflow-visible md:px-0 md:pb-0 md:snap-none",
        )}
      >
        <ul
          className="flex min-w-0 flex-nowrap gap-2 md:flex-wrap"
          aria-label="Filter by collection"
        >
          {chips.map((item) => {
            const active = collection === item.slug;
            return (
              <li key={item.slug} className="shrink-0 snap-start">
                <FilterChip
                  active={active}
                  className="min-h-10 px-3.5 py-2 text-[13.5px] md:min-h-0 md:px-3 md:py-1.5 md:text-[13px]"
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

        {hasFilters ? (
          <button
            type="button"
            className={cn(
              clearButtonClassName,
              "ml-auto hidden md:inline-flex",
            )}
            onClick={clearFilters}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {hasFilters || showAllCollections ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {showAllCollections ? (
            <button
              type="button"
              className="cursor-pointer text-[13px] font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
              onClick={() => navigate("/collections")}
            >
              View all collections
            </button>
          ) : (
            <span />
          )}

          {hasFilters ? (
            <button
              type="button"
              className={cn(clearButtonClassName, "md:hidden")}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
