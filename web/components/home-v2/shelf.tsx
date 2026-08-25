import type { ProductListItem } from "@ishraqparfums/shared";
import Image from "next/image";
import Link from "next/link";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { HOME_SHELF } from "@/lib/content/home-v2";
import { discountPercent, formatPaise } from "@/lib/format/money";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

function ImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-paper-deep">
      <span className="font-editorial text-[28px] text-graphite/25">
        {name}
      </span>
    </div>
  );
}

function ShelfCard({
  product,
  priority,
}: {
  product: ProductListItem;
  priority: boolean;
}) {
  const discount = discountPercent(
    product.fromPricePaise ?? 0,
    product.fromCompareAtPricePaise,
  );
  const soldOut = product.availability !== "AVAILABLE";
  const image = product.primaryImage;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <article>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-paper-deep">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              priority={priority}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-[1.03]"
              unoptimized={shouldUnoptimizeImageSrc(image.url)}
            />
          ) : (
            <ImageFallback name={product.name} />
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="font-editorial text-h4-editorial text-graphite transition-colors group-hover:text-indigo">
            {product.name}
          </h3>
          {product.nameUrdu ? (
            <Urdu
              size="sm"
              tone="brass-deep"
              as="span"
              align="end"
              className="shrink-0 pt-0 leading-[1.6]"
            >
              {product.nameUrdu}
            </Urdu>
          ) : null}
        </div>

        <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.5] text-graphite-soft">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {product.fromPricePaise !== null ? (
            <span className="text-[16px] font-medium text-graphite">
              {formatPaise(product.fromPricePaise)}
            </span>
          ) : null}
          {product.fromSizeMl !== null ? (
            <span className="text-[12px] text-graphite-faint">
              {product.fromSizeMl} ml
            </span>
          ) : null}
          {soldOut ? (
            <span className="text-[12px] text-graphite-faint">Sold out</span>
          ) : discount ? (
            <span className="text-[12px] text-indigo">{discount}% off</span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export function Shelf({ products }: { products: ProductListItem[] }) {
  return (
    <Band space="none" className="pb-16 md:pb-24">
      <BandInner>
        <div className="flex flex-col items-start gap-4 border-b border-graphite/12 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <Urdu size="md">{HOME_SHELF.heading.urdu}</Urdu>
            <h2 className="mt-0.5 font-editorial text-h2-editorial text-graphite">
              {HOME_SHELF.heading.english}
            </h2>
          </div>
          <ButtonLink
            href={HOME_SHELF.action.href}
            variant="outline-ink"
            size="sm"
            className="mb-1 shrink-0 uppercase tracking-[0.16em]"
          >
            {HOME_SHELF.action.label}
          </ButtonLink>
        </div>

        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2">
            {products.slice(0, 4).map((product, i) => (
              <ShelfCard
                key={product.slug}
                product={product}
                priority={i < 2}
              />
            ))}
          </div>
        ) : (
          <p className="mt-10 max-w-[520px] text-[16px] leading-[1.6] text-graphite-soft">
            {HOME_SHELF.empty}
          </p>
        )}
      </BandInner>
    </Band>
  );
}
