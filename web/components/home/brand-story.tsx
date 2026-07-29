import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

export function BrandStory() {
  return (
    <Section tone="cream" space="spacious">
      <Container size="narrow">
        <Reveal>
          <div className="text-center">
            <Eyebrow className="mx-auto">Ishraq — إشراق — radiance, dawn</Eyebrow>

            <p className="font-display mt-7 text-subsection font-semibold text-ink">
              We started with one stubborn idea: that a good perfume should feel
              like it was made for the person wearing it, not for a shelf.
            </p>

            <p className="mt-6 text-[15.5px] leading-relaxed text-ink-soft">
              Everything is composed and bottled here in India, in batches small
              enough that we still smell every one. The{" "}
              <span className="text-ink">Designer</span>{" "}
              collection is for scents you&apos;ll reach for daily;{" "}
              <span className="text-ink">Nostalgia</span>{" "}
              is for the ones that take you somewhere. And if neither is quite
              you, the bespoke quiz exists precisely for that.
            </p>

            <div
              aria-hidden="true"
              className="rule-gold mx-auto mt-10 h-px w-24 opacity-60"
            />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/shop" variant="light" size="lg">
                Browse the collection
              </ButtonLink>
              <ButtonLink href="/bespoke" variant="outline" size="lg">
                How bespoke works
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
