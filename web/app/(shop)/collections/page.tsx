import type { Metadata } from "next";
import { CollectionCard } from "@/components/shop/collection-card";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { getCollections } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Every Ishraq Parfums collection, browsable in full.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <Section>
      <Container size="wide">
        <div className="max-w-2xl">
          <Eyebrow>Browse by mood</Eyebrow>
          <h1 className="font-display mt-4 text-section font-semibold text-ink">
            Collections
          </h1>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
            Every collection we make — including the small-batch runs that
            don&apos;t always make it to the homepage.
          </p>
        </div>

        {collections.length > 0 ? (
          <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="mt-14 text-[15px] text-ink-soft">
            No collections are available right now.
          </p>
        )}
      </Container>
    </Section>
  );
}
