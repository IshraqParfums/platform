import Link from "next/link";
import type { ProductDetail } from "@ishraqparfums/shared";
import { ProductShare } from "@/components/product/product-share";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Rating } from "@/components/ui/rating";

/**
 * PDP identity block — collection link, name, share, rating, short description.
 */
export function ProductDetailInfo({ product }: { product: ProductDetail }) {
  const hasReviews =
    product.ratingAverage !== null && product.reviewCount > 0;

  return (
    <div>
      <Link
        href={`/shop?collection=${product.collection.slug}`}
        className="inline-block transition-colors hover:opacity-80"
      >
        <Eyebrow as="span">{product.collection.name}</Eyebrow>
      </Link>

      <div className="mt-2.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.02em] leading-[1.15] text-ink">
          {product.name}
        </h1>
        <ProductShare title={product.name} className="mt-0.5 shrink-0" />
      </div>

      {hasReviews ? (
        <div className="mt-2.5">
          <a
            href="#reviews"
            className="inline-flex transition-opacity hover:opacity-80"
          >
            <Rating
              average={product.ratingAverage}
              count={product.reviewCount}
            />
          </a>
        </div>
      ) : null}

      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {product.shortDescription}
      </p>
    </div>
  );
}
