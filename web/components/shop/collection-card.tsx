import Image from "next/image";
import Link from "next/link";
import type { CollectionSummary } from "@ishraqparfums/shared";
import { getCollectionArt } from "@/lib/catalog/collection-art";

function formatCollectionMeta(collection: CollectionSummary): string {
  const countLabel = `${collection.productCount} composition${collection.productCount === 1 ? "" : "s"}`;
  return collection.editorialLabel
    ? `${countLabel} · ${collection.editorialLabel}`
    : countLabel;
}

/**
 * Shared collection card for the homepage showcase and `/collections` index.
 * Image art is local (slug map); copy and meta come from the public API.
 * Links into `/shop?collection=` so browsing stays on the catalog surface.
 */
export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  const art = getCollectionArt(collection.slug);
  const meta = formatCollectionMeta(collection);

  return (
    <Link href={`/shop?collection=${collection.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-line/50">
        <Image
          src={art.src}
          alt={art.alt || collection.name}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-105"
        />
      </div>

      <h3 className="font-display mt-4 text-[clamp(18px,1.6vw,22px)] font-semibold leading-snug text-ink transition-colors group-hover:text-rose-deep">
        {collection.name}
      </h3>
      {collection.description ? (
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
          {collection.description}
        </p>
      ) : null}
      <p className="mt-2 font-mono text-label-sm uppercase text-ink-faint">
        {meta}
      </p>
    </Link>
  );
}
