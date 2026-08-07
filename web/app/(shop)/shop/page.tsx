import type { Metadata } from "next";
import {
  PRODUCT_LIST_SORT_DEFAULT,
  type ProductListSort,
} from "@ishraqparfums/shared";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { ProductListing } from "@/components/shop/product-listing";
import { ShopClosingBand } from "@/components/shop/shop-closing-band";
import { ShopFilterRail } from "@/components/shop/shop-filter-rail";
import { ShopMasthead } from "@/components/shop/shop-masthead";
import { ShopNavigationProvider } from "@/components/shop/shop-navigation";
import { ShopResults } from "@/components/shop/shop-results";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  getCollections,
  getHomepageCollections,
  getProducts,
} from "@/lib/api/catalog";
import {
  buildShopHref,
  parseShopPage,
  parseShopSort,
} from "@/lib/shop-query";

export const metadata: Metadata = {
  title: "All Perfumes",
  description:
    "Browse every Ishraq Parfums composition — small-batch perfumes built from a real perfumer's palette.",
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

  const [products, homepageCollections, collections] = await Promise.all([
    getProducts({ collection, q, sort, page }),
    getHomepageCollections(),
    getCollections(),
  ]);

  const activeCollection = collection
    ? collections.find((item) => item.slug === collection)
    : undefined;

  return (
    <ShopNavigationProvider>
      <ShopMasthead
        total={products.total}
        collection={activeCollection}
        q={q}
      />

      <Section space="compact" className="!pt-0 md:!pt-0">
        <Container size="wide">
          <ShopFilterRail
            homepageCollections={homepageCollections}
            activeCollection={activeCollection}
            totalCollectionCount={collections.length}
            collection={collection}
            q={q}
            sort={sort}
          />

          <div className="mt-8 md:mt-10">
            <ShopResults skeleton={<ProductGridSkeleton count={8} />}>
              <ProductListing
                page={products}
                collections={collections}
                emptyQuery={q}
                emptyCollectionName={activeCollection?.name}
                emptyCollectionSlug={activeCollection?.slug}
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
        </Container>
      </Section>

      <ShopClosingBand />
    </ShopNavigationProvider>
  );
}
