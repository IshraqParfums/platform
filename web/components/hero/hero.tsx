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
 * readable over bright smoke.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-deep pt-[68px]">
      <div className="absolute inset-0 z-0">
        <HeroPlate opacity={0.92} />
      </div>

      {/* Not atmosphere — legibility. The brightest highlights the headline
          crosses measure 248 against cream text at 244, so without this the
          words disappear over them. Invisible as a shape. */}
      <div
        aria-hidden="true"
        className="hero-scrim pointer-events-none absolute inset-0 z-10"
      />

      <Container size="wide" className="relative z-20">
        <div className="flex min-h-[min(88vh,940px)] flex-col justify-center py-24 text-center md:py-28">
          <Eyebrow className="mx-auto text-gold-soft">
            Small-batch perfumery · Made in India
          </Eyebrow>

          <h1 className="font-display mx-auto mt-8 max-w-5xl text-display font-semibold text-cream-soft">
            A scent that&apos;s{" "}
            <em className="font-medium italic text-gold-soft">unmistakably</em>{" "}
            yours
          </h1>

          <div
            aria-hidden="true"
            className="mx-auto mt-12 h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-gold/35 to-transparent"
          />

          <p className="mx-auto mt-10 max-w-lg text-lead text-cream/75">
            Browse compositions built from a real perfumer&apos;s palette — or
            answer ten questions and we&apos;ll compose a bespoke formula around
            you.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <ButtonLink href="/bespoke/quiz" size="lg">
              Find your blend
            </ButtonLink>
            <ButtonLink href="/shop" variant="outline-dark" size="lg">
              Shop the collection
            </ButtonLink>
          </div>

          {/* Each item carries its own trailing separator so a wrap can never
              start a line with a dangling dot. */}
          <ul className="mt-11 flex flex-wrap justify-center gap-x-3.5 gap-y-2.5">
            {MICRO.map((item, i) => (
              <li
                key={item}
                className={
                  "font-mono text-label uppercase text-cream/60" +
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
