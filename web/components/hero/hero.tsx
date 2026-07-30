import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroPlate } from "@/components/hero/hero-plate";

const MICRO = [
  "Handcrafted in small batches",
  "Flat ₹50 shipping",
  "2-minute scent quiz, no sign-up",
];

/**
 * Full-bleed photographic background behind the type. Soft edge mask + scrim
 * keep the plate from reading as a hard rectangle and keep the headline
 * readable over bright smoke. Content is capped to roughly one viewport so
 * eyebrow, lead, and both CTAs stay in the first view.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-deep pt-[68px]">
      <div className="absolute inset-0 z-0">
        <HeroPlate opacity={0.92} />
      </div>

      {/* Not atmosphere — legibility. Deepened over the type band so cream
          copy and the eyebrow clear the bottle glow. */}
      <div
        aria-hidden="true"
        className="hero-scrim pointer-events-none absolute inset-0 z-10"
      />

      <Container size="wide" className="relative z-20">
        <div className="flex min-h-[calc(100svh-68px)] max-h-[900px] flex-col justify-center py-10 text-center md:py-12">
          <Eyebrow tone="cream" className="hero-eyebrow mx-auto">
            Small-batch perfumery · Made in India
          </Eyebrow>

          <h1 className="font-display text-hero mx-auto mt-5 max-w-4xl font-semibold text-cream-soft">
            A scent that&apos;s{" "}
            <em className="font-medium italic text-gold-soft">unmistakably</em>{" "}
            yours
          </h1>

          <div
            aria-hidden="true"
            className="mx-auto mt-6 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-gold/35 to-transparent"
          />

          <p className="mx-auto mt-5 max-w-lg text-lead text-cream/80">
            Browse compositions built from a real perfumer&apos;s palette — or
            answer ten questions and we&apos;ll compose a bespoke formula around
            you.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <ButtonLink href="/bespoke/quiz" size="lg">
              Find your blend
            </ButtonLink>
            <ButtonLink href="/shop" variant="outline-dark" size="lg">
              Shop the collection
            </ButtonLink>
          </div>

          {/* Each item carries its own trailing separator so a wrap can never
              start a line with a dangling dot. */}
          <ul className="mt-7 flex flex-wrap justify-center gap-x-3.5 gap-y-2.5">
            {MICRO.map((item, i) => (
              <li
                key={item}
                className={
                  "font-mono text-label uppercase text-cream/70" +
                  (i < MICRO.length - 1
                    ? " after:ml-3.5 after:text-gold/45 after:content-['·']"
                    : "")
                }
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
