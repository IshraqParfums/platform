import Image from "next/image";
import Link from "next/link";
import type { CollectionSummary } from "@ishraqparfums/shared";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

/** Decorative art per collection, served locally so this section never waits on the API. */
const ART: Record<string, string> = {
  designer: "/products/citrus-atelier.jpg",
  nostalgia: "/products/monsoon-letters.jpg",
  "limited-edition": "/products/oud-ishraq.jpg",
};
const FALLBACK_ART = "/products/cedar-sessions.jpg";

function Panel({
  collection,
  large,
  index,
}: {
  collection: CollectionSummary;
  large: boolean;
  index: number;
}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={cn(
        "group relative isolate flex h-full overflow-hidden rounded-3xl ring-1 ring-line/40",
        large ? "min-h-[380px] lg:min-h-[520px]" : "min-h-[248px]",
      )}
    >
      <Image
        src={ART[collection.slug] ?? FALLBACK_ART}
        alt=""
        fill
        sizes={large ? "(min-width:1024px) 50vw, 92vw" : "(min-width:1024px) 50vw, 92vw"}
        className="-z-10 object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-deep-deeper/92 via-deep/55 to-deep/20"
      />

      <div className="flex w-full flex-col justify-end p-7 lg:p-9">
        <p className="font-mono text-label-sm uppercase text-gold-soft">
          {String(index + 1).padStart(2, "0")} — Collection
        </p>
        <h3
          className={cn(
            "font-display mt-2 font-semibold text-cream-soft",
            large ? "text-[clamp(30px,3.6vw,42px)]" : "text-2xl",
          )}
        >
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-cream/70">
            {collection.description}
          </p>
        )}
        <span className="mt-6 inline-flex items-center gap-2 font-mono text-label uppercase text-cream-soft">
          Explore
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1.5"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

export function CollectionsShowcase({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <Section tone="cream-soft">
      <Container size="wide">
        <SectionHeading
          eyebrow="Find your corner"
          title="Three ways in"
          description="Start from a mood rather than a bottle. Each collection is built around a different reason to wear perfume."
        />

        <div className="mt-12 grid gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-5">
          {collections.map((collection, i) => (
            <Reveal
              key={collection.slug}
              delay={i * 100}
              className={cn(i === 0 && "lg:row-span-2", "h-full")}
            >
              <Panel collection={collection} large={i === 0} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
