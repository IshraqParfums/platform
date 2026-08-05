import type { CollectionSummary } from "@ishraqparfums/shared";
import { CollectionCard } from "@/components/shop/collection-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Homepage collections entry — up to three curated picks from
 * `GET /collections?homepage=true` (`Collection.homeRank`). Bespoke lives in
 * its own section below; this block is collections-only and links out to the
 * full index when there are more than the homepage slots.
 */
export function CollectionsShowcase({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  return (
    <Section tone="cream-soft" space="compact">
      <Container size="wide">
        <SectionHeading
          eyebrow="Find your corner"
          title="Start with a mood"
          description="Each collection is a mood — pick one to begin, or browse the full shelf."
          action={{ href: "/collections", label: "Explore all collections" }}
        />

        {collections.length > 0 ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-x-8">
            {collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[15px] text-ink-soft lg:mt-10">
            Collections will appear here once they&apos;re curated for the
            homepage.
          </p>
        )}
      </Container>
    </Section>
  );
}
