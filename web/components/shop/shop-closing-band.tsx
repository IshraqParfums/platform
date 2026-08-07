import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

/**
 * Soft exit from the shop catalogue — points shoppers toward bespoke and
 * collections so the page doesn't end on pagination alone.
 */
export function ShopClosingBand() {
  return (
    <Section tone="cream-soft" space="compact" bordered>
      <Container size="wide">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-xl">
            <Eyebrow>Keep exploring</Eyebrow>
            <h2 className="font-display mt-3 text-[clamp(1.35rem,2.4vw,1.75rem)] font-semibold tracking-tight text-ink">
              Looking for something more personal?
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">
              Start with a mood in the collections, or answer ten questions and
              we&apos;ll compose a blend that&apos;s yours alone.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href="/collections"
              variant="outline"
              size="sm"
              className="font-mono text-label uppercase tracking-[0.14em]"
            >
              Collections
            </ButtonLink>
            <ButtonLink
              href="/bespoke"
              variant="emphasis"
              size="sm"
              className="font-mono text-label uppercase tracking-[0.14em]"
            >
              Bespoke
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
