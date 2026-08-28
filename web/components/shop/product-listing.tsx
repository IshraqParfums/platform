import type {
  PaginatedResponse,
  ProductListItem,
} from "@ishraqparfums/shared";
import { Fragment } from "react";
import { PaginationNav } from "@/components/shop/pagination-nav";
import { ShopJournalRow } from "@/components/shop/shop-journal-row";
import { ButtonLink } from "@/components/ui/button";
import { SHOP } from "@/lib/content/shop";

/**
 * Owns empty state, the two-column journal grid, and pagination.
 * Order follows the catalogue query (newest by default).
 */
export function ProductListing({
  page,
  buildPageHref,
  emptyMessage,
  emptyQuery,
  emptyCollectionName,
}: {
  page: PaginatedResponse<ProductListItem>;
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

    return (
      <div className="py-6">
        <h2 className="font-editorial text-[clamp(24px,3vw,32px)] leading-[1.15] text-graphite">
          {headline}
        </h2>
        <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-graphite-soft">
          {SHOP.emptyLead}
        </p>

        <ButtonLink
          href="/shop"
          variant="outline-paper"
          size="pill"
          className="mt-8"
        >
          {SHOP.emptyCta}
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2 md:gap-y-14">
        {page.items.map((product, index) => (
          <Fragment key={product.slug}>
            {index > 0 ? (
              <div
                aria-hidden="true"
                className="col-span-full mt-[2.625rem] mb-[2.8rem] h-px bg-graphite/40 md:hidden"
              />
            ) : null}
            <ShopJournalRow product={product} priority={index < 2} />
          </Fragment>
        ))}
      </div>
      <PaginationNav
        page={page.page}
        pageSize={page.pageSize}
        total={page.total}
        buildHref={buildPageHref}
      />
    </>
  );
}
