import type { ProductListItem } from "@ishraqparfums/shared";
import Image from "next/image";
import Link from "next/link";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { HOME_COLLECTION } from "@/lib/content/home-v2";
import { formatPaise } from "@/lib/format/money";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

function CollectionRating({
  slug,
  average,
  count,
}: {
  slug: string;
  average: number | null;
  count: number;
}) {
  if (average === null || count <= 0) return null;

  return (
    <span className="mt-4 inline-flex items-center gap-2">
      <span className="flex items-center gap-0.5 text-terra" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(1, Math.max(0, average - i));
          const id = `home-col-star-${slug}-${i}`;
          return (
            <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
              <defs>
                <linearGradient id={id}>
                  <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                  <stop offset={`${fill * 100}%`} stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
                fill={`url(#${id})`}
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}
      </span>
      <span className="text-[13px] text-graphite-soft">
        {average.toFixed(1)}
        <span className="sr-only"> out of 5 stars</span> ({count})
      </span>
    </span>
  );
}

function CollectionCard({
  product,
  index,
}: {
  product: ProductListItem;
  index: number;
}) {
  const imageSrc = product.primaryImage?.url ?? null;
  const imageAlt =
    product.primaryImage?.altText?.trim() || product.name;
  const openingNotes = product.openingNotes ?? [];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-5 sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-stretch sm:gap-7"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-deep">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 300px, 100vw"
            unoptimized={shouldUnoptimizeImageSrc(imageSrc)}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-[1.02]"
            priority={index === 0}
          />
        ) : null}
      </div>

      <div className="flex min-h-0 min-w-0 flex-col sm:h-full sm:justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-3 sm:block">
            <h3 className="font-editorial text-[26px] leading-[1.1] text-graphite transition-colors duration-200 group-hover:text-terra sm:text-[30px]">
              {product.name}
            </h3>
            {product.nameUrdu ? (
              <Urdu size="sm" align="start" className="shrink-0 pt-0">
                {product.nameUrdu}
              </Urdu>
            ) : null}
          </div>

          <span
            aria-hidden="true"
            className="mt-5 hidden h-px w-10 bg-graphite/20 sm:block"
          />

          <p className="mt-4 hidden max-w-[34ch] text-[14px] leading-[1.55] text-graphite-soft sm:block">
            {product.shortDescription}
          </p>

          {openingNotes.length > 0 ? (
            <ul className="mt-3 hidden text-[13px] leading-[1.55] text-terra sm:block">
              {openingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          <CollectionRating
            slug={product.slug}
            average={product.ratingAverage}
            count={product.reviewCount}
          />
        </div>

        <div className="mt-3 sm:mt-6">
          <p className="flex items-baseline gap-2.5 text-[20px] leading-none text-graphite sm:text-[22px]">
            {product.fromPricePaise !== null
              ? formatPaise(product.fromPricePaise)
              : null}
            {product.fromSizeMl !== null ? (
              <span className="text-[16px] text-graphite-faint sm:text-[17px]">
                {product.fromSizeMl} ml
              </span>
            ) : null}
          </p>

          {product.availability === "OUT_OF_STOCK" ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {HOME_COLLECTION.soldOut}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function Collection({ products }: { products: ProductListItem[] }) {
  const shown = products.slice(0, 4);

  return (
    <section className="bg-paper py-[45px] md:py-[63px]">
      <BandInner>
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="text-[13px] text-terra">{HOME_COLLECTION.kicker}</p>
            <h2 className="mt-3 max-w-[30ch] font-editorial text-h2-editorial text-graphite">
              {HOME_COLLECTION.heading}
            </h2>
            <p className="mt-5 max-w-[54ch] text-[16px] leading-[1.6] text-graphite-soft">
              {HOME_COLLECTION.lead}
            </p>
          </div>

          {shown.length > 0 ? (
            <ButtonLink
              variant="outline-paper"
              size="pill"
              href={HOME_COLLECTION.cta.href}
              className="mt-7 inline-flex lg:mt-0 lg:shrink-0"
            >
              {HOME_COLLECTION.cta.label}
            </ButtonLink>
          ) : null}
        </div>

        {shown.length > 0 ? (
          <div className="mt-12 grid gap-x-16 gap-y-14 md:mt-16 lg:grid-cols-2">
            {shown.map((product, i) => (
              <CollectionCard key={product.slug} product={product} index={i} />
            ))}
          </div>
        ) : (
          <p className="mt-8 max-w-[48ch] text-[16px] text-graphite-soft">
            {HOME_COLLECTION.empty}
          </p>
        )}
      </BandInner>
    </section>
  );
}
