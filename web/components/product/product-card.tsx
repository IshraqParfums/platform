import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@ishraqparfums/shared";
import { ProductCollectionBadge } from "@/components/product/product-collection-badge";
import { ProductDiscountBadge } from "@/components/product/product-discount-badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/cn";
import { discountPercent } from "@/lib/format/money";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

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

/** Matches the Rating star row so cards without reviews keep the same height. */
const RATING_ROW_MIN_H = "min-h-[1.25rem]";

/**
 * Catalog product card.
 * `editorial` (default): homepage / related — fuller type.
 * `compact`: shop grid — denser type for 2-col mobile cells.
 */
export function ProductCard({
  product,
  collectionLabel,
  priority = false,
  density = "editorial",
  className,
}: {
  product: ProductListItem;
  collectionLabel?: string;
  priority?: boolean;
  density?: "editorial" | "compact";
  className?: string;
}) {
  const label = collectionLabel ?? prettifySlug(product.collectionSlug);
  const compact = density === "compact";
  const off =
    product.fromPricePaise != null
      ? discountPercent(product.fromPricePaise, product.fromCompareAtPricePaise)
      : null;

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
          "relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-deep ring-1 ring-line/40",
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
            sizes="(min-width:1280px) 320px, (min-width:768px) 30vw, 46vw"
            unoptimized={shouldUnoptimizeImageSrc(product.primaryImage.url)}
            className={cn(
              "object-cover",
              HOVER_EASE,
              "md:transition-transform md:group-hover:scale-[1.03]",
            )}
          />
        ) : (
          <ImageFallback name={product.name} />
        )}

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-deep/70 to-transparent opacity-80",
            HOVER_EASE,
            "md:opacity-0 md:transition-opacity md:group-hover:opacity-100",
          )}
        />

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 font-mono text-label-sm uppercase tracking-[0.14em] text-cream-soft/90 opacity-0",
            HOVER_EASE,
            "md:transition-opacity md:group-hover:opacity-100",
          )}
        >
          View
        </span>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5 md:p-3">
          <ProductCollectionBadge className="min-w-0">
            {label}
          </ProductCollectionBadge>
          {off ? <ProductDiscountBadge percent={off} /> : null}
        </div>
      </div>

      <div className={cn(compact ? "pt-3" : "pt-4")}>
        <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5 sm:gap-1")}>
          <h3
            className={cn(
              "font-display font-semibold leading-snug text-ink",
              compact
                ? "text-[1.05rem] tracking-[-0.01em] sm:text-[clamp(1.1rem,1.3vw,1.25rem)]"
                : "text-[1.35rem] tracking-[-0.015em] sm:text-[clamp(1.2rem,1.4vw,1.35rem)] sm:tracking-[-0.01em]",
              HOVER_EASE,
              "md:transition-colors md:group-hover:text-rose-deep",
            )}
          >
            {product.name}
          </h3>

          <div className={RATING_ROW_MIN_H}>
            <Rating
              average={product.ratingAverage}
              count={product.reviewCount}
              showEmpty
            />
          </div>

          <p
            className={cn(
              "line-clamp-1 leading-snug text-ink-faint",
              compact ? "text-[12px]" : "text-[13px] sm:text-[12.5px]",
            )}
          >
            {product.shortDescription}
          </p>

          <Price
            pricePaise={product.fromPricePaise}
            compareAtPaise={product.fromCompareAtPricePaise}
            sizeMl={product.fromSizeMl}
            layout="stacked"
            size={compact ? "sm" : "md"}
            className={cn(compact ? "mt-1" : "mt-1.5 sm:mt-1")}
          />
          {product.availability === "OUT_OF_STOCK" ? (
            <p
              className={cn(
                "font-mono uppercase tracking-[0.12em] text-ink-faint",
                compact ? "mt-1 text-[10px]" : "mt-1.5 text-label-sm",
              )}
            >
              Sold out
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
