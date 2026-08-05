import Link from "next/link";
import type { CollectionSummary, PaginatedResponse, ProductListItem } from "@ishraqparfums/shared";
import { PaginationNav } from "@/components/shop/pagination-nav";
import { ProductGrid } from "@/components/shop/product-grid";

/**
 * Owns the "given a page of products, what does the page look like" concerns —
 * empty state, grid, pagination — so shop listing stays one implementation.
 */
export function ProductListing({
  page,
  collections,
  buildPageHref,
  emptyMessage = "No products match your filters yet.",
}: {
  page: PaginatedResponse<ProductListItem>;
  collections: CollectionSummary[];
  buildPageHref: (pageNumber: number) => string;
  emptyMessage?: string;
}) {
  if (page.items.length === 0) {
    return (
      <div className="rounded-3xl border border-line/60 bg-card px-8 py-16 text-center">
        <p className="text-[15px] text-ink-soft">{emptyMessage}</p>
        <Link
          href="/shop"
          className="mt-5 inline-flex items-center gap-2 font-mono text-label uppercase text-rose-deep transition-colors hover:text-ink"
        >
          Browse all products
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
