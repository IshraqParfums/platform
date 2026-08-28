import {
  PRODUCT_LIST_SORT_DEFAULT,
  type CollectionSummary,
  type ProductListSort,
} from "@ishraqparfums/shared";
import Link from "next/link";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { SHOP } from "@/lib/content/shop";
import { buildShopHref } from "@/lib/shop-query";

/**
 * Compact catalogue index title. Collection description is one line when a
 * collection is selected; search uses the results meta instead.
 */
export function ShopMasthead({
  total,
  collection,
  q,
  sort,
}: {
  total: number;
  collection?: CollectionSummary;
  q?: string;
  sort: ProductListSort;
}) {
  const query = q?.trim() || undefined;
  const unfiltered = !collection && !query;
  const searchMeta = query
    ? `${total} result${total === 1 ? "" : "s"} for "${query}"`
    : undefined;

  const kicker = collection?.editorialLabel?.trim() || SHOP.kicker;
  const title = collection?.name ?? SHOP.heading;
  const collectionLead = collection?.description?.trim();
  const allHref = buildShopHref({
    q: query,
    sort: sort === PRODUCT_LIST_SORT_DEFAULT ? undefined : sort,
  });

  return (
    <header>
      {collection ? (
        <nav
          aria-label="Breadcrumb"
          className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-graphite-faint"
        >
          <Link
            href={allHref}
            className="transition-colors hover:text-graphite"
          >
            All perfumes
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/collections"
            className="transition-colors hover:text-graphite"
          >
            Collections
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-graphite-soft">{collection.name}</span>
        </nav>
      ) : null}
      <p className="text-[12px] text-terra md:text-[13px]">{kicker}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-editorial text-[28px] leading-[1.1] text-graphite md:text-[32px]">
          {title}
        </h1>
        {unfiltered ? (
          <Urdu size="sm" tone="brass" align="start" leading="tight" as="span">
            {SHOP.urdu}
          </Urdu>
        ) : null}
        {searchMeta ? (
          <p className="text-[13px] text-graphite-soft">{searchMeta}</p>
        ) : null}
      </div>
      {collectionLead && !query ? (
        <p className="mt-1.5 max-w-[54ch] truncate text-[14px] leading-[1.45] text-graphite-soft">
          {collectionLead}
        </p>
      ) : null}
    </header>
  );
}
