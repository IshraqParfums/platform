import type { CollectionSummary } from "@ishraqparfums/shared";
import Image from "next/image";
import Link from "next/link";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { getCollectionArt } from "@/lib/catalog/collection-art";
import { HOME_MOODS } from "@/lib/content/home-v2";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

/**
 * Collections as a pick-a-direction row.
 *
 * Desktop is three tiles. Mobile is a snap-scroll strip rather than three
 * stacked full-bleed panels: a 380px tile repeated three times is more than
 * a thousand pixels of photography before the next action, and that is the
 * wrong density for a phone.
 */
export function Moods({ collections }: { collections: CollectionSummary[] }) {
  return (
    <Band space="none" className="mt-4 md:mt-8">
      <BandInner className="pb-6 md:pb-8">
        <Urdu size="md">{HOME_MOODS.heading.urdu}</Urdu>
        <h2 className="mt-0.5 font-editorial text-h2-editorial text-graphite">
          {HOME_MOODS.heading.english}
        </h2>
      </BandInner>

      {collections.length > 0 ? (
        <div className="flex gap-0.5 overflow-x-auto snap-x snap-mandatory scrollbar-brand lg:grid lg:grid-cols-3 lg:overflow-visible">
          {collections.slice(0, 3).map((collection) => {
            const art = getCollectionArt(collection.slug);
            return (
              <Link
                key={collection.slug}
                href={`/shop?collection=${collection.slug}`}
                className="group relative h-[280px] w-[min(82vw,400px)] shrink-0 snap-start overflow-hidden bg-graphite sm:h-[340px] lg:h-[440px] lg:w-auto"
              >
                <Image
                  src={art.src}
                  alt={art.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 82vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-105"
                  style={{ objectPosition: "center 48%" }}
                  unoptimized={shouldUnoptimizeImageSrc(art.src)}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-graphite/[0.62] via-graphite/[0.06] to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="font-ui text-micro font-semibold uppercase text-shell/70">
                    {collection.productCount}{" "}
                    {collection.productCount === 1
                      ? "composition"
                      : "compositions"}
                  </p>
                  <h3 className="mt-2 font-editorial text-h3-editorial text-shell">
                    {collection.name}
                  </h3>
                  {collection.description ? (
                    <p className="mt-2 max-w-[290px] line-clamp-2 text-[15px] leading-[1.55] text-shell/[0.82]">
                      {collection.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <BandInner>
          <p className="max-w-[520px] text-[16px] leading-[1.6] text-graphite-soft">
            {HOME_MOODS.empty}
          </p>
        </BandInner>
      )}
    </Band>
  );
}
