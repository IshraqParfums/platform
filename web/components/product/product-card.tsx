import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@ishraqparfums/shared";
import { ProductCollectionBadge } from "@/components/product/product-collection-badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/cn";

function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Fallback for products with no photography yet — a monogram on the brand
 * gradient rather than a broken image box. This is a real case in the catalog,
 * not a defensive hypothetical.
 */
function ImageFallback({ name }: { name: string }) {
  return (
    <div className="grain relative flex h-full w-full items-center justify-center bg-gradient-to-br from-deep-soft via-deep to-deep-deeper">
      <span className="font-display text-4xl font-semibold text-gold-soft/40">
        {name.charAt(0)}
      </span>
    </div>
  );
}

const HOVER_EASE = "duration-[280ms] ease-[cubic-bezier(0.22,0.8,0.28,1)]";

/**
 * Catalog product card.
 * Mobile: image-led editorial entry, one-line description, strong price.
 * Desktop: existing hover lift and denser metadata (ratings).
 */
export function ProductCard({
  product,
  collectionLabel,
  priority = false,
  className,
}: {
  product: ProductListItem;
  collectionLabel?: string;
  priority?: boolean;
  className?: string;
}) {
  const label = collectionLabel ?? prettifySlug(product.collectionSlug);
  const hasReviews =
    product.ratingAverage !== null && product.reviewCount > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex h-full flex-col",
        HOVER_EASE,
        "md:transition-transform md:hover:-translate-y-[3px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-deep ring-1 ring-line/40",
          HOVER_EASE,
          "md:transition-[box-shadow,ring-color]",
          "md:group-hover:shadow-[0_18px_40px_-24px_rgba(28,22,18,0.55)] md:group-hover:ring-gold/25",
        )}
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            priority={priority}
            sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, 92vw"
            className={cn(
              "object-cover",
              HOVER_EASE,
              "md:transition-transform md:group-hover:scale-[1.03]",
            )}
          />
        ) : (
          <ImageFallback name={product.name} />
        )}

        <ProductCollectionBadge className="left-3.5 top-3.5 px-3.5 py-2 md:left-3 md:top-3 md:px-3 md:py-1.5">
          {label}
        </ProductCollectionBadge>
      </div>

      <div className="pt-4 sm:pt-4">
        <div className="flex flex-col gap-1.5 sm:gap-1">
          <h3
            className={cn(
              "font-display text-[1.35rem] font-semibold tracking-[-0.015em] leading-snug text-ink sm:text-[clamp(1.2rem,1.4vw,1.35rem)] sm:tracking-[-0.01em]",
              HOVER_EASE,
              "md:transition-colors md:group-hover:text-rose-deep",
            )}
          >
            {product.name}
          </h3>

          {hasReviews ? (
            <div className="hidden sm:block">
              <Rating
                average={product.ratingAverage}
                count={product.reviewCount}
              />
            </div>
          ) : null}

          <p className="line-clamp-1 text-[13px] leading-snug text-ink-faint sm:text-[12.5px]">
            {product.shortDescription}
          </p>

          <Price
            pricePaise={product.fromPricePaise}
            compareAtPaise={product.fromCompareAtPricePaise}
            sizeMl={product.fromSizeMl}
            layout="stacked"
            className="mt-1.5 sm:mt-1"
          />
        </div>
      </div>
    </Link>
  );
}
