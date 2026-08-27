import type { ProductListItem } from "@ishraqparfums/shared";
import Image from "next/image";
import Link from "next/link";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { HOME_COLLECTION, notesForProduct, worldForProduct } from "@/lib/content/home-v2";
import { formatPaise } from "@/lib/format/money";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

/**
 * One repeated unit, four times: still on the left, copy on the right, all four
 * cards identical. The previous pass ran a 7–5 / 5–7 mosaic across three
 * different aspect ratios, so no two plates were the same size and the eye had
 * nowhere to settle.
 *
 * Copy sits on paper, never on the photograph. Six lines of type over a busy
 * still — under a scrim dark enough to carry them — is what made the section
 * read as vague: everything was at a different contrast against a moving
 * background. Below the image they are simply black on parchment.
 */
function CollectionCard({
  product,
  index,
}: {
  product: ProductListItem;
  index: number;
}) {
  const world = worldForProduct(product, index);
  const imageSrc = product.primaryImage?.url ?? world.src;
  const imageAlt = product.primaryImage?.altText?.trim() || world.alt;
  const notes = notesForProduct(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-5 sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start sm:gap-7"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-deep">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 300px, 100vw"
          unoptimized={shouldUnoptimizeImageSrc(imageSrc)}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-[1.02]"
          priority={index === 0}
        />
      </div>

      <div className="min-w-0">
        {/* Below sm the card is a compact strip — name/Urdu share a row and
            notes drop entirely, matching the image-over-copy stack the card
            already switches to at this breakpoint. sm+ keeps the original
            stacked name/Urdu, unchanged. */}
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

        <div className="hidden sm:block">
          {notes ? (
            <>
              <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-graphite-faint">
                {HOME_COLLECTION.notesLabel}
              </p>
              <ul className="mt-2 space-y-1 text-[14px] leading-[1.5] text-graphite-soft">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          ) : (
            // No authored descriptor for this slug. Its own copy, never another
            // perfume's notes — see `notesForProduct`.
            <p className="mt-4 max-w-[34ch] text-[14px] leading-[1.55] text-graphite-soft">
              {product.shortDescription}
            </p>
          )}
        </div>

        <p className="mt-3 flex items-baseline gap-2 text-[14px] text-graphite sm:mt-6">
          {product.fromPricePaise !== null
            ? formatPaise(product.fromPricePaise)
            : null}
          {product.fromSizeMl !== null ? (
            <span className="text-graphite-faint">· {product.fromSizeMl} ml</span>
          ) : null}
          {/* sm+ only. Below sm the whole card is already the only affordance
              — a redundant label there added nothing but had also never been
              visible on touch anyway (it used to be hover-only). */}
          <span className="ml-auto hidden text-[12px] uppercase tracking-[0.14em] text-terra sm:inline">
            {HOME_COLLECTION.action} →
          </span>
        </p>

        {product.availability === "OUT_OF_STOCK" ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
            {HOME_COLLECTION.soldOut}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function Collection({ products }: { products: ProductListItem[] }) {
  const shown = products.slice(0, 4);

  /**
   * Baseline padding on both sides now that Materials sits on `paper-deep`
   * (not the same parchment) above this — that's a real colour seam, not a
   * silent same-tone stack, so this section owning its own top clearance no
   * longer doubles up on Materials' bottom padding the way it used to.
   * ~56% of the `py-20 md:py-28` baseline (45px / 63px) — full baseline read
   * as too much on both sides once there was a real seam to lean on.
   */
  return (
    <section className="bg-paper py-[45px] md:py-[63px]">
      {/* Header and grid share one BandInner so their left edges line up — the
          old grid had its own narrower max-width and drifted past 1320px. */}
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
