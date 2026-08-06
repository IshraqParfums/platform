import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailInfo } from "@/components/product/product-detail-info";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRelated } from "@/components/product/product-related";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";
import { ProductStory } from "@/components/product/product-story";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getProductBySlug } from "@/lib/api/catalog";
import { getProductReviews } from "@/lib/api/reviews";
import { getRelatedProducts } from "@/lib/catalog/related-products";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product" };
  }
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(slug, { page: 1, pageSize: 10 }),
    getRelatedProducts(product),
  ]);

  return (
    <>
      <Section space="compact" className="!pt-5 md:!pt-6 !pb-6 md:!pb-8">
        <Container size="wide">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-label-sm uppercase tracking-wide text-ink-faint"
          >
            <Link href="/shop" className="transition-colors hover:text-ink">
              Shop
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/shop?collection=${product.collection.slug}`}
              className="transition-colors hover:text-ink"
            >
              {product.collection.name}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink-soft normal-case tracking-normal font-sans text-[13px]">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 md:items-start lg:gap-12">
            <div className="md:sticky md:top-24">
              <ProductGallery name={product.name} images={product.images} />
            </div>

            <div className="flex flex-col gap-5 md:gap-6">
              <ProductDetailInfo product={product} />
              <ProductPurchasePanel
                variants={product.variants}
                product={{
                  name: product.name,
                  slug: product.slug,
                  collectionName: product.collection.name,
                  shortDescription: product.shortDescription,
                  primaryImageUrl:
                    [...product.images].sort(
                      (a, b) => a.displayOrder - b.displayOrder,
                    )[0]?.url ?? null,
                }}
              />
              <ProductStory text={product.detailedDescription} />
            </div>
          </div>
        </Container>
      </Section>

      <Section
        tone="cream-soft"
        space="compact"
        bordered
        className="!py-8 md:!py-10"
      >
        <Container size="wide">
          <ProductReviewsSection slug={slug} initial={reviews} />
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section space="compact" className="!pt-8 md:!pt-10 !pb-12 md:!pb-16">
          <Container size="wide">
            <ProductRelated products={related} />
          </Container>
        </Section>
      ) : null}
    </>
  );
}
