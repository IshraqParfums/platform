import Image from "next/image";
import Link from "next/link";
import type { CollectionSummary } from "@ishraqparfums/shared";
import { getCollectionArt } from "@/lib/catalog/collection-art";
import { cn } from "@/lib/cn";

function formatCollectionMeta(collection: CollectionSummary): string {
  const countLabel = `${collection.productCount} composition${collection.productCount === 1 ? "" : "s"}`;
  return collection.editorialLabel
    ? `${countLabel} · ${collection.editorialLabel}`
    : countLabel;
}

/**
 * v2 `/collections` tile — forked from `components/shop/collection-card.tsx`
 * rather than restyled in place: that card is still reachable from
 * `components/home/collections-showcase.tsx`, an orphaned v1 homepage
 * section that isn't wired into any route today but isn't dead enough to
 * repaint out from under. Ring + hairline treatment follows the same v2
 * image-tile idiom as `cart/cart-line.tsx`; art and copy sourcing are
 * unchanged (`getCollectionArt` is a plain lookup, no theming to fork).
 */
export function CollectionTile({
  collection,
  priority = false,
}: {
  collection: CollectionSummary;
  priority?: boolean;
}) {
  const art = getCollectionArt(collection.slug);
  const meta = formatCollectionMeta(collection);

  return (
    <Link href={`/shop?collection=${collection.slug}`} className="group block">
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-paper-deep",
          "ring-1 ring-graphite/10 transition-[box-shadow,ring-color] duration-300",
          "ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:ring-terra/35",
        )}
      >
        <Image
          src={art.src}
          alt={art.alt || collection.name}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-[1.03]"
        />
      </div>

      <h3 className="mt-4 font-editorial text-[clamp(18px,1.6vw,22px)] leading-snug text-graphite transition-colors duration-200 group-hover:text-terra">
        {collection.name}
      </h3>
      {collection.description ? (
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-graphite-soft">
          {collection.description}
        </p>
      ) : null}
      <p className="mt-2 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
        {meta}
      </p>
    </Link>
  );
}
