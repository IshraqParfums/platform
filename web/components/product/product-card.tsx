import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@ishraqparfums/shared";
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

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex h-full flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.28,1)] hover:-translate-y-1.5",
        className,
      )}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-deep ring-1 ring-line/40">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            priority={priority}
            sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, 82vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-105"
          />
        ) : (
          <ImageFallback name={product.name} />
        )}

        <span className="absolute left-3 top-3 rounded-full bg-deep/70 px-3 py-1.5 font-mono text-label-sm uppercase text-gold-soft backdrop-blur-sm">
          {label}
        </span>
      </div>

      {/* Clear hierarchy rather than four competing lines: name, then rating,
          then one supporting line, and price alone on the bottom row so a
          discount badge can never push it into a second line. */}
      <div className="flex flex-1 flex-col pt-5">
        <h3 className="font-display text-[19px] font-semibold leading-snug text-ink transition-colors group-hover:text-rose-deep">
          {product.name}
        </h3>

        <div className="mt-1.5 min-h-[16px]">
          <Rating average={product.ratingAverage} count={product.reviewCount} />
        </div>

        <p className="mt-2 line-clamp-1 text-[13px] leading-relaxed text-ink-soft">
          {product.shortDescription}
        </p>

        <div className="mt-auto pt-4">
          <Price
            pricePaise={product.fromPricePaise}
            compareAtPaise={product.fromCompareAtPricePaise}
            from={product.fromPricePaise !== null}
          />
        </div>
      </div>
    </Link>
  );
}
