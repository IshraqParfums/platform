import Link from "next/link";
import type { CollectionSummary, PaginatedResponse, ProductListItem } from "@ishraqparfums/shared";
import { PaginationNav } from "@/components/shop/pagination-nav";
import { ProductGrid } from "@/components/shop/product-grid";
import { OrnamentalDivider } from "@/components/ui/ornamental-divider";

/**
 * Owns the "given a page of products, what does the page look like" concerns —
 * empty state, grid, pagination — so shop listing stays one implementation.
 */
export function ProductListing({
  page,
  collections,
  buildPageHref,
  emptyMessage,
  emptyQuery,
  emptyCollectionName,
}: {
  page: PaginatedResponse<ProductListItem>;
  collections: CollectionSummary[];
  buildPageHref: (pageNumber: number) => string;
  emptyMessage?: string;
  emptyQuery?: string;
  emptyCollectionName?: string;
}) {
  if (page.items.length === 0) {
    const query = emptyQuery?.trim();
    const headline = query
      ? `No matches for "${query}"`
      : emptyCollectionName
        ? `Nothing in ${emptyCollectionName} yet`
        : emptyMessage ?? "No products match your filters yet.";

    const suggestions = collections.slice(0, 4);

    return (
      <div className="rounded-3xl border border-line/60 bg-card px-6 py-14 text-center sm:px-10 sm:py-16">
        <OrnamentalDivider className="mb-6 max-w-[10rem] text-ink-faint/70" />
        <p className="font-display text-[1.35rem] font-semibold text-ink sm:text-[1.5rem]">
          {headline}
        </p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Try another collection, clear the search, or browse the full shelf.
        </p>

        {suggestions.length > 0 ? (
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/shop?collection=${item.slug}`}
                  className="inline-flex items-center rounded-full border border-ink/20 px-3.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 font-mono text-label uppercase text-rose-deep transition-colors hover:text-ink"
        >
          Clear filters
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ProductGrid products={page.items} collections={collections} />
      <PaginationNav
        page={page.page}
        pageSize={page.pageSize}
        total={page.total}
        buildHref={buildPageHref}
      />
    </>
  );
}
