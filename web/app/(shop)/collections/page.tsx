import type { Metadata } from "next";
import { CollectionTile } from "@/components/collections/collection-tile";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { COLLECTIONS } from "@/lib/content/collections";
import { getCollections } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Every Ishraq Parfums collection, browsable in full.",
};

/**
 * Plain `<section>` + `BandInner` rather than the v1 `Section`/`Container`/
 * `Eyebrow` trio this page used to render through — same departure `/shop`,
 * `/cart` and `/checkout` already made (see the comment on `cart/page.tsx`).
 * `/collections` is a paper route now (see `isPaperStorefrontPath` in
 * lib/layout.ts).
 */
export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner>
        <header className="max-w-2xl">
          <p className="text-[12px] text-terra md:text-[13px]">
            {COLLECTIONS.kicker}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-editorial text-[clamp(30px,4.2vw,42px)] leading-[1.04] text-graphite">
              {COLLECTIONS.heading}
            </h1>
            <Urdu size="sm" tone="brass" align="start" leading="tight" as="span">
              {COLLECTIONS.urdu}
            </Urdu>
          </div>
          <p className="mt-4 text-[15.5px] leading-relaxed text-graphite-soft">
            {COLLECTIONS.lead}
          </p>
        </header>

        {collections.length > 0 ? (
          <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <CollectionTile
                key={collection.slug}
                collection={collection}
                priority={index === 0}
              />
            ))}
          </div>
        ) : (
          <p className="mt-14 text-[15px] text-graphite-soft">
            {COLLECTIONS.empty}
          </p>
        )}
      </BandInner>
    </section>
  );
}
