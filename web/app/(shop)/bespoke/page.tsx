import type { Metadata } from "next";
import Link from "next/link";
import { pricePaiseForSize } from "@ishraqparfums/shared";
import { BespokeLandingBottle } from "@/components/bespoke/bespoke-landing-bottle";
import { BandInner } from "@/components/home-v2/ui/band";
import { ButtonLink } from "@/components/ui/button";
import { formatPaise } from "@/lib/format/money";

export const metadata: Metadata = {
  title: "Bespoke",
  description:
    "Fifteen questions. A matched bottle and a divergent 2 ml sample — composed around you.",
};

const STEPS = [
  {
    title: "Answer about fifteen questions",
    body: "None of them about perfume. Mood, memory, how you want to be worn.",
  },
  {
    title: "We match your fingerprint",
    body: "A bottle composed around you, plus a complimentary 2 ml divergent sample.",
  },
  {
    title: "Name it, save it, or buy it",
    body: "Keep the formula in your account, or add a size to cart when you're ready.",
  },
] as const;

/**
 * The bespoke pitch, restaged in the v2 parchment theme.
 *
 * One CTA label, not two. The page this replaces said "Take the quiz" in
 * the header and "Begin the quiz" beside the visual — the same intent
 * twice in different words, which the rest of the v2 home page is careful
 * never to do. "Begin the quiz" survives because it reads better beside
 * the bottle than a flatter "Take" does.
 *
 * The right column is the same bottle glyph the result page uses once a
 * match exists. Before a question has been answered there is no personal
 * colour yet, so the juice steps through the family accents the match
 * will eventually pick from — not an empty vial, and not a catalog still.
 */
export default function BespokeLandingPage() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <BandInner>
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="font-ui text-micro-sm font-semibold uppercase tracking-[0.24em] text-terra">
              A consultation.
            </p>
            <h1 className="mt-3 max-w-[14ch] font-editorial text-h1-editorial text-graphite">
              A consultation that becomes a bottle.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.6] text-graphite-soft">
              Answer about fifteen questions, none of them about perfume. We
              match a full bottle to your fingerprint and include a 2 ml
              divergent sample with every order.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              <ButtonLink href="/bespoke/quiz" variant="ink" size="pill">
                Begin the quiz
              </ButtonLink>
              <Link
                href="/bespoke/saved"
                className="font-ui text-[13px] font-medium text-graphite-soft underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50"
              >
                Saved formulas
              </Link>
            </div>

            <p className="mt-5 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
              From {formatPaise(pricePaiseForSize(30))} · 30 / 50 / 100 ml
            </p>

            <ol className="mt-12 space-y-7 border-t border-graphite/12 pt-9">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex items-baseline gap-5">
                  <span className="font-editorial text-[26px] leading-none text-terra">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[16px] font-medium text-graphite">
                      {step.title}
                    </p>
                    <p className="mt-1.5 max-w-[46ch] text-[14px] leading-[1.55] text-graphite-soft">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="min-w-0 w-full">
            <BespokeLandingBottle />
            <p className="mt-4 w-full text-center text-[13px] leading-[1.5] text-graphite-soft">
              The juice takes the family colour of the match: woody, floral,
              spicy, and the rest. The consultation picks which one is yours.
            </p>
          </div>
        </div>
      </BandInner>
    </section>
  );
}
