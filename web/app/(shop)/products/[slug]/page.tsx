import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { ProductArrival } from "@/components/product-v2/product-arrival";
import { ProductBackLabel } from "@/components/product-v2/product-back-label";
import { ProductBuyBarSentinel } from "@/components/product-v2/product-buy-bar-sentinel";
import { ProductClosingBuy } from "@/components/product-v2/product-closing-buy";
import { ProductFaq } from "@/components/product-v2/product-faq";
import { ProductMobileBuyBar } from "@/components/product-v2/product-mobile-buy-bar";
import { ProductNameChapter } from "@/components/product-v2/product-name-chapter";
import { ProductNotesChapter } from "@/components/product-v2/product-notes-chapter";
import { ProductRelated } from "@/components/product-v2/product-related";
import { ProductReviewsSection } from "@/components/product-v2/reviews/product-reviews-section";
import { ProductSmellsChapter } from "@/components/product-v2/product-smells-chapter";
import { ProductWearingChapter } from "@/components/product-v2/product-wearing-chapter";
import { ProductPurchaseProvider } from "@/components/product-v2/purchase-context";
import {
  hasBackLabel,
  hasMeaning,
  hasNotes,
  hasSmells,
  pdpSplitPairClass,
} from "@/components/product-v2/chapters";
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
 * PDP v2.
 *
 * Ordered for a shopper rather than a perfumer: what it smells like in plain
 * English, then the note pyramid, then where the name comes from — not the
 * reverse. Every band alternates tone (paper → paper-deep → paper → shell →
 * …) because that's how the homepage separates sections; hairlines between
 * blocks were doing that job badly.
 *
 * Bands are gated on the presence predicates in `chapters.ts` so a sparse
 * product never renders an empty stripe of parchment. The sections still
 * self-null on their own — that's the real guard, this just avoids the
 * empty frame around it.
 *
 * `ProductPurchaseProvider` wraps everything so the arrival panel, the
 * sticky mobile bar and the closing row share one selected variant and one
 * add-to-cart path. Media never pins; the only sticky element is the mobile
 * bar, and it retires at the sentinel so it never covers the footer.
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

  const primaryImageUrl =
    [...product.images].sort((a, b) => a.displayOrder - b.displayOrder)[0]
      ?.url ?? null;

  // The closing CTA is client-gated on the selected variant, but availability
  // is known here — and AVAILABLE guarantees at least one sellable size, so
  // this band never renders empty.
  const showClosingBuy = product.availability === "AVAILABLE";

  return (
    <ProductPurchaseProvider
      variants={product.variants}
      availability={product.availability}
      product={{
        name: product.name,
        slug: product.slug,
        collectionName: product.collection.name,
        shortDescription: product.shortDescription,
        primaryImageUrl,
      }}
    >
      {/* `font-ui` so PDP body copy is Jost, like the rest of the v2 house —
          without it the page inherits the v1 sans from `body`. */}
      <div className="font-ui text-graphite">
        <Band tone="paper" space="none" className="pt-5 pb-16 md:pt-6 md:pb-20">
          <BandInner>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-graphite-faint"
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
              <span className="text-graphite-soft">{product.name}</span>
            </nav>

            <ProductArrival product={product} />
          </BandInner>
        </Band>

        {hasSmells(product) || hasNotes(product) ? (
          <Band
            tone="paper-deep"
            space="none"
            className="py-[3.75rem] md:py-[5.25rem]"
          >
            <BandInner>
              <div className={pdpSplitPairClass}>
                <ProductSmellsChapter
                  olfactoryProfile={product.olfactoryProfile}
                />
                <ProductNotesChapter notesPyramid={product.notesPyramid} />
              </div>
            </BandInner>
          </Band>
        ) : null}

        {hasMeaning(product) ? (
          <Band
            tone="paper"
            space="none"
            className="py-[3.75rem] md:py-[5.25rem]"
          >
            <BandInner>
              <ProductNameChapter
                identity={product.identity}
                meaningStory={product.meaningStory}
              />
            </BandInner>
          </Band>
        ) : null}

        <Band
          tone="shell"
          space="none"
          className="py-[3.75rem] md:py-[5.25rem]"
        >
          <BandInner>
            <ProductWearingChapter />
          </BandInner>
        </Band>

        {hasBackLabel(product) || showClosingBuy ? (
          <Band tone="paper" space="default">
            <BandInner>
              <div className="flex flex-col gap-14">
                <ProductBackLabel
                  format={product.format}
                  olfactoryProfile={product.olfactoryProfile}
                />
                <ProductClosingBuy />
              </div>
            </BandInner>
          </Band>
        ) : null}

        {product.faq && product.faq.length > 0 ? (
          <Band
            tone="paper-deep"
            space="none"
            className="py-[3.25rem] md:py-[4.55rem]"
          >
            <BandInner>
              <ProductFaq faq={product.faq} />
            </BandInner>
          </Band>
        ) : null}

        {/* `id="reviews"` lives on the section itself (with its own
            scroll-margin), so the band must not repeat it. */}
        {reviews ? (
          <Band tone="paper" space="compact">
            <BandInner>
              <ProductReviewsSection slug={slug} initial={reviews} />
            </BandInner>
          </Band>
        ) : null}

        {related.length > 0 ? (
          <Band tone="paper-deep" space="compact">
            <BandInner>
              <ProductRelated products={related} />
            </BandInner>
          </Band>
        ) : null}

        {/* Retires the sticky bar before the footer. */}
        <ProductBuyBarSentinel />
      </div>

      <ProductMobileBuyBar />
    </ProductPurchaseProvider>
  );
}
