import type { Metadata } from "next";
import Link from "next/link";
import { BESPOKE_PAISE_PER_ML } from "@ishraqparfums/shared";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { Vial } from "@/components/ui/vial";
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
    body: "A bottle composed around you — plus a complimentary 2 ml divergent sample.",
  },
  {
    title: "Name it, save it, or buy it",
    body: "Keep the formula in your account, or add a size to cart when you’re ready.",
  },
];

export default function BespokeLandingPage() {
  return (
    <Section tone="cream-soft" space="compact">
      <Container size="wide">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <Eyebrow>Bespoke</Eyebrow>
            <h1 className="font-display mt-4 text-hero font-semibold text-ink">
              A consultation that becomes a bottle.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
              Answer about fifteen questions — none of them about perfume. We
              match a full bottle to your fingerprint and include a 2&nbsp;ml
              divergent sample with every order.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/bespoke/quiz" variant="emphasis" size="lg">
                Take the quiz
              </ButtonLink>
          <Link
            href="/bespoke/saved"
            className="text-sm font-medium text-ink-soft underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink/50"
          >
            Saved formulas
          </Link>
            </div>
            <p className="mt-5 font-mono text-label uppercase text-ink-faint">
              From {formatPaise(BESPOKE_PAISE_PER_ML * 30)} · 30 / 50 / 100 ml
            </p>

            <ol className="mt-10 flex flex-col gap-5 border-t border-ink/[0.08] pt-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="font-mono text-label leading-6 text-gold-deeper">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-[17px] font-semibold text-ink">
                      {step.title}
                    </p>
                    <p className="mt-1 text-meta text-ink-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-ink/12 bg-card px-8 py-12 sm:py-14">
            <div className="text-gold-deeper/80">
              <Vial fill={82} bands={{ top: 28, heart: 42, base: 30 }} />
            </div>
            <p className="mt-8 max-w-xs text-center font-display text-[18px] font-semibold leading-snug text-ink">
              A matched bottle — and a 2&nbsp;ml vial of the other answer.
            </p>
            <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-ink-soft">
              Brief on the result page. Full production sheet for our atelier.
            </p>
            <ButtonLink
              href="/bespoke/quiz"
              variant="emphasis"
              size="md"
              className="mt-8"
            >
              Begin the quiz
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
