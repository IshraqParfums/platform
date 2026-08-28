import { ProductListing } from "@/components/shop/product-listing";
import { ShopClosingBand } from "@/components/shop/shop-closing-band";
import { ShopFilterRail } from "@/components/shop/shop-filter-rail";
import { ShopJournalSkeleton } from "@/components/shop/shop-journal-skeleton";
import { ShopMasthead } from "@/components/shop/shop-masthead";
import { ShopNavigationProvider } from "@/components/shop/shop-navigation";
import { ShopResults } from "@/components/shop/shop-results";
import { BandInner } from "@/components/home-v2/ui/band";
import {
  getCollections,
  getProducts,
} from "@/lib/api/catalog";
import {
  buildShopHref,
  parseShopPage,
  parseShopSort,
} from "@/lib/shop-query";
import {
  PRODUCT_LIST_SORT_DEFAULT,
  type ProductListSort,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Perfumes",
  description:
    "Browse every Ishraq Parfums composition. Small-batch perfumes built from a real perfumer's palette.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    collection?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const collection = params.collection?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const sort: ProductListSort = parseShopSort(params.sort);
  const page = parseShopPage(params.page);

  const [products, collections] = await Promise.all([
    getProducts({ collection, q, sort, page }),
    getCollections(),
  ]);

  const activeCollection = collection
    ? collections.find((item) => item.slug === collection)
    : undefined;

  return (
    <ShopNavigationProvider>
      <div className="bg-paper font-ui text-graphite">
        <BandInner className="pt-6 pb-16 md:pt-8 sm:pb-20">
          <ShopFilterRail
            title={
              <ShopMasthead
                total={products.total}
                collection={activeCollection}
                q={q}
                sort={sort}
              />
            }
            collection={collection}
            q={q}
            sort={sort}
          />

          <div className="mt-8 md:mt-10">
            <ShopResults skeleton={<ShopJournalSkeleton count={4} />}>
              <ProductListing
                page={products}
                emptyQuery={q}
                emptyCollectionName={activeCollection?.name}
                buildPageHref={(pageNumber) =>
                  buildShopHref({
                    collection,
                    q,
                    sort:
                      sort === PRODUCT_LIST_SORT_DEFAULT ? undefined : sort,
                    page: pageNumber,
                  })
                }
              />
            </ShopResults>
          </div>
        </BandInner>

        <ShopClosingBand />
      </div>
    </ShopNavigationProvider>
  );
}
