import Link from "next/link";
import {
  BESPOKE_PAISE_PER_ML,
  BESPOKE_TEASER_MATERIALS,
} from "@ishraqparfums/shared";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { OrnateFrame } from "@/components/ui/ornate-frame";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { ShimmerFrame } from "@/components/ui/shimmer-frame";
import { Vial } from "@/components/ui/vial";
import { formatPaise } from "@/lib/format/money";

const STEPS = [
  {
    title: "Answer about fifteen questions",
    body: "None of them about perfume. Mood, memory, how you want to be worn. A few minutes, no sign-up.",
  },
  {
    title: "We match your fingerprint",
    body: "Your answers build a scent fingerprint. We match it to a bottle — and a divergent 2 ml sample.",
  },
  {
    title: "Name it, save it, or buy it",
    body: `Bottled at 100 ml for ${formatPaise(BESPOKE_PAISE_PER_ML * 100)}. Save the blend and order when you're ready.`,
  },
];

const PREVIEW_OPTIONS = [
  "Warmth. Something people move closer to.",
  "Quiet. Only the people next to me.",
  "Presence. I want to be noticed when I enter.",
  "Soft. A trail that stays after I leave.",
];

export function BespokeTeaser() {
  return (
    <Section tone="deep" glow mist="subtle">
      <Container size="wide">
        <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div>
            <Eyebrow tone="gold">The bespoke blend</Eyebrow>
            <h2 className="font-display mt-6 text-section font-semibold text-cream-soft">
              You can&apos;t smell a screen.
              <br />
              <em className="font-medium italic text-gold-soft">
                So we ask instead.
              </em>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/70">
              Fifteen questions about how you want to feel — none of them about
              perfume. The result is a matched bottle and a small divergent
              sample, composed from the same materials our perfumer works with.
            </p>

            <ol className="mt-9 flex flex-col gap-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="font-mono text-label leading-6 text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-[17px] font-semibold text-cream-soft">
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-meta text-cream/65">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Reveal>
            <div className="rounded-3xl border border-cream/12 bg-cream/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-label uppercase text-gold-soft">
                  Opening question
                </span>
                <span className="font-mono text-label-sm text-cream/50">
                  ~15 questions
                </span>
              </div>

              <div
                aria-hidden="true"
                className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-cream/10"
              >
                <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-gold to-rose" />
              </div>

              <h3 className="font-display mt-6 text-[clamp(20px,2.4vw,26px)] font-semibold leading-snug text-cream-soft">
                When you walk into a room, how should this arrive with you?
              </h3>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {PREVIEW_OPTIONS.map((label, i) => (
                  <li key={label}>
                    <Link
                      href="/bespoke/quiz"
                      className="group flex items-center gap-3 rounded-xl border border-cream/12 bg-deep/40 px-4 py-3.5 text-left text-[14px] font-semibold text-cream/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-cream/8 hover:text-cream-soft"
                    >
                      <span className="font-mono text-label-sm text-cream/45 transition-colors group-hover:text-gold">
                        {i + 1}
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-center font-mono text-label-sm uppercase text-cream/50">
                Begin the consultation — nothing to sign up for
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-16 block lg:mt-20">
          <ShimmerFrame>
            <OrnateFrame
              inset={9}
              className="flex flex-col gap-10 rounded-3xl border border-cream/12 bg-gradient-to-br from-cream/6 to-transparent p-9 sm:p-11 lg:flex-row lg:items-center lg:gap-14"
            >
              <div className="flex shrink-0 justify-center pt-11 text-gold-soft/70 lg:px-6">
                <Vial fill={82} bands={{ top: 28, heart: 42, base: 30 }} />
              </div>

              <div className="min-w-0 flex-1">
                <Eyebrow tone="gold">What you leave with</Eyebrow>
                <p className="font-display mt-5 text-[clamp(20px,2.4vw,28px)] font-semibold text-cream-soft">
                  A bottle matched to you — and a 2&nbsp;ml vial of the other
                  answer.
                </p>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-cream/70">
                  Brief details on the result page. Full production sheet for
                  our atelier. You name it; we make it.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <ButtonLink href="/bespoke/quiz" size="lg">
                    Begin the quiz
                  </ButtonLink>
                  <span className="font-mono text-label uppercase text-cream/55">
                    100 ml · {formatPaise(BESPOKE_PAISE_PER_ML * 100)}
                  </span>
                </div>
              </div>
            </OrnateFrame>
          </ShimmerFrame>
        </Reveal>
      </Container>
    </Section>
  );
}

export const BESPOKE_TEASER_MATERIAL_COUNT = BESPOKE_TEASER_MATERIALS.length;
