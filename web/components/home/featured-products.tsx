import type { CollectionSummary, ProductListItem } from "@ishraqparfums/shared";
import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function FeaturedProducts({
  products,
  collections,
}: {
  products: ProductListItem[];
  collections: CollectionSummary[];
}) {
  if (products.length === 0) {
    return null;
  }

  const labels = new Map(collections.map((c) => [c.slug, c.name]));

  return (
    <Section tone="cream" space="compact">
      <Container size="wide">
        <SectionHeading
          eyebrow="The collection"
          title="Compositions worth wearing"
          description="Each one built on a small set of real perfumery materials — bright at the top, warm through the heart, and long-wearing at the base."
          action={{ href: "/shop", label: "View all" }}
        />

        {/* Wider gutters rather than bigger cards — density is what makes a
            grid feel cheap. `h-full` on the Reveal wrapper is what lets the
            cards stretch to a common height so prices line up across the row. */}
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-x-10">
          {products.map((product, i) => (
            <Reveal
              key={product.slug}
              delay={i * 90}
              className="h-full border-b border-line/50 pb-14 last:border-b-0 sm:border-b-0 sm:pb-0"
            >
              <ProductCard
                product={product}
                collectionLabel={labels.get(product.collectionSlug)}
                priority={i < 2}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
