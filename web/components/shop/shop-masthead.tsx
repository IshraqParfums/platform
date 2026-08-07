import type { CollectionSummary } from "@ishraqparfums/shared";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

/**
 * Espresso arrival band for `/shop`.
 * Default: catalogue masthead. Collection / search: same band, text-only.
 */
export function ShopMasthead({
  total,
  collection,
  q,
}: {
  total: number;
  collection?: CollectionSummary;
  q?: string;
}) {
  const query = q?.trim() || undefined;
  const countLabel = `${total} composition${total === 1 ? "" : "s"}`;
  const meta = query
    ? `${total} result${total === 1 ? "" : "s"} for "${query}"`
    : countLabel;

  const eyebrow = collection?.editorialLabel?.trim() || "The catalogue";
  const title = collection?.name ?? "All Perfumes";
  const lead =
    collection?.description?.trim() ||
    "Handcrafted compositions built from a real perfumer's palette.";

  return (
    <Section
      tone="deep"
      glow
      mist="subtle"
      space="compact"
      className="!py-8 md:!py-12"
    >
      <Container size="wide">
        <Eyebrow tone="gold">{eyebrow}</Eyebrow>

        <h1 className="font-display mt-4 text-[clamp(1.85rem,5vw,2.75rem)] font-semibold tracking-tight text-cream-soft md:mt-5 md:text-[clamp(2rem,3.2vw,2.75rem)]">
          {title}
        </h1>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cream/70 md:mt-4 md:text-[15.5px]">
          {lead}
        </p>

        <p className="mt-5 font-mono text-label-sm uppercase tracking-wide text-gold-soft/80 md:mt-6">
          {meta}
        </p>
      </Container>
    </Section>
  );
}
