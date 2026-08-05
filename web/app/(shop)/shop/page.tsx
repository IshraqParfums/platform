import type { Metadata } from "next";
import {
  PRODUCT_LIST_SORT_DEFAULT,
  type ProductListSort,
} from "@ishraqparfums/shared";
import { ProductListing } from "@/components/shop/product-listing";
import { ShopIntro } from "@/components/shop/shop-intro";
import { ShopNavigationProvider } from "@/components/shop/shop-navigation";
import { ShopResults } from "@/components/shop/shop-results";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
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

  return (
    <Section space="compact" className="!pt-5 md:!pt-6">
      <Container size="wide">
        <ShopNavigationProvider>
          <ShopIntro total={products.total} />

          <div className="mt-6">
            <ShopToolbar
              homepageCollections={homepageCollections}
              totalCollectionCount={collections.length}
              collection={collection}
              q={q}
              sort={sort}
            />
          </div>

          <div className="mt-6">
            <ShopResults>
              <ProductListing
                page={products}
                collections={collections}
                buildPageHref={(pageNumber) =>
                  buildShopHref({
                    collection,
                    q,
                    sort:
                      sort === PRODUCT_LIST_SORT_DEFAULT ? undefined : sort,
                    page: pageNumber,
                  })
                }
                emptyMessage="No products match your filters yet."
              />
            </ShopResults>
          </div>
        </ShopNavigationProvider>
      </Container>
    </Section>
  );
}
