import type { CollectionSummary } from "@ishraqparfums/shared";
import { ExploreRow } from "@/components/home/explore-row";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Vial } from "@/components/ui/vial";

/** Decorative art per collection slug, served locally so this section never waits on the API. */
const ART: Record<string, { src: string; alt: string }> = {
  designer: { src: "/products/citrus-atelier.jpg", alt: "Citrus Atelier perfume bottle" },
  nostalgia: { src: "/products/monsoon-letters.jpg", alt: "Monsoon Letters perfume bottle" },
  "limited-edition": { src: "/products/oud-ishraq.jpg", alt: "Oud Ishraq perfume bottle" },
};
const FALLBACK_ART = { src: "/products/cedar-sessions.jpg", alt: "" };

/**
 * "Three ways in" — one static Bespoke row (not a database collection; the
 * same custom-perfume feature covered in full further down the page) plus one
 * row per admin-picked collection from `GET /collections?homepage=true`.
 *
 * Curation lives entirely server-side: which collections appear and in what
 * order is decided by `Collection.homeRank`, not by array position. A
 * collection can exist and be fully browsable without ever showing here.
 */
export function CollectionsShowcase({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  return (
    <Section tone="cream-soft">
      <Container size="wide">
        <SectionHeading
          eyebrow="Find your corner"
          title="Three ways in"
          description="Start from a mood rather than a bottle — or skip the guessing and let us compose one around you."
        />

        {/* No gap here — each row past the first supplies its own top
            border + padding (see ExploreRow), so spacing isn't doubled. */}
        <div className="mt-14 flex flex-col lg:mt-16">
          <ExploreRow
            index={0}
            imageSide="right"
            eyebrow="The custom option"
            title="Compose your own"
            description="Ten questions about how you want to feel, then a formula built just for you from the same perfumer's palette — top, heart and base, named however you like."
            href="/bespoke"
            ctaLabel="Start the quiz"
            image={{
              src: "/products/amber-meridian.jpg",
              alt: "A bespoke perfume formula, backlit in golden mist",
            }}
            accent={
              <div className="mt-6 flex items-end text-gold-soft/70">
                <Vial fill={72} bands={{ top: 30, heart: 40, base: 30 }} width={52} height={100} />
              </div>
            }
          />

          {collections.map((collection, i) => (
            <ExploreRow
              key={collection.slug}
              index={i + 1}
              delay={i * 90}
              imageSide={i % 2 === 0 ? "left" : "right"}
              eyebrow="Collection"
              title={collection.name}
              description={
                collection.description ??
                "A composition built from our closed palette of raw materials."
              }
              href={`/collections/${collection.slug}`}
              ctaLabel="Explore the collection"
              image={ART[collection.slug] ?? FALLBACK_ART}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
