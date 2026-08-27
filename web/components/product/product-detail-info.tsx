import Link from "next/link";
import type { ProductDetail } from "@ishraqparfums/shared";
import { ProductShare } from "@/components/product/product-share";
import { Rating } from "@/components/ui/rating";

/**
 * PDP identity block — collection link, name, share, rating, short description.
 * Ported from product/product-detail-info.tsx: same structure and logic, v2
 * tokens. The old `Eyebrow` usage is now a plain terra kicker line.
 */
export function ProductDetailInfo({ product }: { product: ProductDetail }) {
  const hasReviews =
    product.ratingAverage !== null && product.reviewCount > 0;

  return (
    <div>
      <Link
        href={`/shop?collection=${product.collection.slug}`}
        className="inline-block text-[13px] text-terra transition-colors hover:opacity-80"
      >
        {product.collection.name}
      </Link>

      <div className="mt-2.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="font-editorial text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.15] text-graphite">
          {product.name}
        </h1>
        <ProductShare
          name={product.name}
          blurb={product.shortDescription}
          className="mt-0.5 shrink-0"
        />
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

      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
        {product.shortDescription}
      </p>
    </div>
  );
}
