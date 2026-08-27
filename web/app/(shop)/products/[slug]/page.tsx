import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { ProductDetailInfo } from "@/components/product/product-detail-info";
import { ProductFaq } from "@/components/product/product-faq";
import { ProductFormatInfo } from "@/components/product/product-format-info";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductHowToUse } from "@/components/product/product-how-to-use";
import { ProductCare } from "@/components/product/product-care";
import { ProductMeaning } from "@/components/product/product-meaning";
import { ProductNotesPyramid } from "@/components/product/product-notes-pyramid";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRelated } from "@/components/product/product-related";
import { ProductReviewsSection } from "@/components/product/reviews/product-reviews-section";
import { ProductScentProfile } from "@/components/product/product-scent-profile";
import { ProductStory } from "@/components/product/product-story";
import { ProductTagline } from "@/components/product/product-tagline";
import { ProductUnavailableNotice } from "@/components/product/product-unavailable-notice";
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

  // Sold-out stays indexed; archived / shelf-off do not.
  const indexable = product.availability !== "UNAVAILABLE";

  return {
    title: product.name,
    description: product.shortDescription,
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

/**
 * PDP. Every new content section (`ProductTagline`, `ProductMeaning`,
 * `ProductNotesPyramid`, `ProductScentProfile`, `ProductFormatInfo`,
 * `ProductHowToUse`, `ProductCare`, `ProductFaq`) is rendered
 * unconditionally — no ternaries here — because each one returns `null`
 * internally when its slice of `product` is absent. That's what keeps this
 * page correct both for the 9 seeded products (which now carry real PDP
 * content) and for any future product that doesn't yet.
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(slug, { page: 1, pageSize: 10 }).catch(() => null),
    getRelatedProducts(product),
  ]);

  const unavailable = product.availability !== "AVAILABLE";

  return (
    <>
      <Band tone="paper" space="none" className="pt-5 pb-6 md:pt-6 md:pb-8">
        <BandInner>
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint"
          >
            <Link
              href="/shop"
              className="transition-colors hover:text-graphite"
            >
              Shop
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/shop?collection=${product.collection.slug}`}
              className="transition-colors hover:text-graphite"
            >
              {product.collection.name}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-ui text-[13px] normal-case tracking-normal text-graphite-soft">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-8 lg:gap-12">
            <div className="md:sticky md:top-24">
              <ProductGallery name={product.name} images={product.images} />
            </div>

            <div className="flex flex-col gap-5 md:gap-6">
              <ProductDetailInfo product={product} />
              <ProductTagline tagline={product.tagline} />
              {unavailable ? (
                <ProductUnavailableNotice
                  availability={
                    product.availability === "UNAVAILABLE"
                      ? "UNAVAILABLE"
                      : "OUT_OF_STOCK"
                  }
                />
              ) : null}
              <ProductPurchasePanel
                availability={product.availability}
                variants={product.variants}
                claims={product.claims}
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
              <ProductMeaning
                identity={product.identity}
                meaningStory={product.meaningStory}
              />
              <ProductNotesPyramid notesPyramid={product.notesPyramid} />
              <ProductScentProfile olfactoryProfile={product.olfactoryProfile} />
              <ProductFormatInfo format={product.format} />
              <ProductStory text={product.detailedDescription} />
              <ProductHowToUse steps={product.howToUse} />
              <ProductCare items={product.care} />
            </div>
          </div>
        </BandInner>
      </Band>

      <Band tone="shell" space="compact">
        <BandInner>
          <ProductFaq faq={product.faq} />
        </BandInner>
      </Band>

      {reviews ? (
        <Band tone="paper-deep" space="compact" bordered id="reviews">
          <BandInner>
            <ProductReviewsSection slug={slug} initial={reviews} />
          </BandInner>
        </Band>
      ) : null}

      {related.length > 0 ? (
        <Band tone="paper" space="compact">
          <BandInner>
            <ProductRelated products={related} />
          </BandInner>
        </Band>
      ) : null}
    </>
  );
}
