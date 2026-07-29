import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

const MICRO = [
  "Handcrafted in small batches",
  "Flat ₹50 shipping",
  "2-minute scent quiz, no sign-up",
];

export function Hero() {
  return (
    <section className="grain relative overflow-hidden bg-deep pt-[68px]">
      <div
        aria-hidden="true"
        className="glow-gold pointer-events-none absolute inset-x-0 -top-16 h-[85%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-1/2 h-[420px] w-[420px] rounded-full bg-rose-deep/10 blur-[130px]"
      />

      <Container size="wide" className="relative">
        {/* Text column gets the larger share — the image was carrying too much
            of the visual weight at 0.95fr. */}
        <div className="grid items-center gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow className="text-gold-soft">
              Small-batch perfumery · Made in India
            </Eyebrow>

            <h1 className="font-display mt-6 text-display font-semibold text-cream-soft">
              A scent that&apos;s{" "}
              <em className="font-medium italic text-gold-soft">
                unmistakably
              </em>{" "}
              yours
            </h1>

            <p className="mt-6 max-w-lg text-lead text-cream/70">
              Browse compositions built from a real perfumer&apos;s palette — or
              answer ten questions and we&apos;ll compose a bespoke formula
              around you.
            </p>

            {/* The CTA is its own decision point, so it gets real air on both sides. */}
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <ButtonLink href="/bespoke/quiz" size="lg">
                Find your blend
              </ButtonLink>
              <ButtonLink href="/shop" variant="outline-dark" size="lg">
                Shop the collection
              </ButtonLink>
            </div>

            {/* Each item carries its own trailing separator so a wrap can never
                start a line with a dangling dot. */}
            <ul className="mt-9 flex flex-wrap gap-x-3.5 gap-y-2.5">
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

          <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:ml-auto">
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-[28px] ring-1 ring-gold/25">
              <Image
                src="/products/amber-meridian.jpg"
                alt="Amber Meridian — golden amber perfume, backlit in mist"
                fill
                priority
                sizes="(min-width:1024px) 420px, 88vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-deep-deeper/80 via-transparent to-transparent"
              />

              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-label-sm uppercase text-gold-soft">
                    Designer
                  </p>
                  <p className="font-display mt-1 text-xl font-semibold text-cream-soft">
                    Amber Meridian
                  </p>
                </div>
                <span className="rounded-full bg-cream-soft/92 px-4 py-2 font-mono text-label-sm uppercase text-deep">
                  from ₹1,799
                </span>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-[28px] border border-gold/20"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
