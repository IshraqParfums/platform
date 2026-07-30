import Link from "next/link";
import {
  BESPOKE_PAISE_PER_ML,
  CORE_QUESTIONS,
  MATERIAL_POOL,
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
    title: "Answer ten questions",
    body: "Mood, season, the smells you already love. Two minutes, no sign-up.",
  },
  {
    title: "We compose your formula",
    body: "A few follow-ups narrow it down, then the blend is built from our material palette.",
  },
  {
    title: "Name it, and it's yours",
    body: `Bottled at 100 ml for ${formatPaise(BESPOKE_PAISE_PER_ML * 100)}. Rename it whatever you like.`,
  },
];

/** Representative formula, built from the real shipped material pool. */
function exampleRow(role: string, names: string[], pct: number) {
  const materials = names
    .map((n) => MATERIAL_POOL.find((m) => m.name === n))
    .filter((m): m is (typeof MATERIAL_POOL)[number] => Boolean(m));
  return { role, materials, pct };
}

const EXAMPLE = [
  exampleRow("Top", ["Bergamot", "Pinkpepper"], 28),
  exampleRow("Heart", ["Hedione", "Jasmine Sambac"], 42),
  exampleRow("Base", ["Ambroxan 10%", "Iso E Super"], 30),
];

const FIRST_QUESTION = CORE_QUESTIONS[0];

export function BespokeTeaser() {
  return (
    <Section tone="deep" glow mist="subtle">
      <Container size="wide">
        {/* ------------------------------------------------ intro + steps */}
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
              Ten questions about how you want to feel, then a handful of
              follow-ups based on what you leaned toward. The result is a real
              formula — top, heart and base — composed from the same materials
              our perfumer works with.
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
                    <p className="mt-1.5 text-meta text-cream/65">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* --------------------------------------- live first question */}
          <Reveal>
            <div className="rounded-3xl border border-cream/12 bg-cream/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-label uppercase text-gold-soft">
                  Question 1 of 10
                </span>
                <span className="font-mono text-label-sm text-cream/50">
                  ~2 min
                </span>
              </div>

              <div
                aria-hidden="true"
                className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-cream/10"
              >
                <div className="h-full w-[10%] rounded-full bg-gradient-to-r from-gold to-rose" />
              </div>

              <h3 className="font-display mt-6 text-[clamp(20px,2.4vw,26px)] font-semibold leading-snug text-cream-soft">
                {FIRST_QUESTION.text}
              </h3>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {FIRST_QUESTION.options.map((option, i) => (
                  <li key={option.label}>
                    <Link
                      href={`/bespoke/quiz?q1=${i}`}
                      className="group flex items-center gap-3 rounded-xl border border-cream/12 bg-deep/40 px-4 py-3.5 text-left text-[14px] font-semibold text-cream/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-cream/8 hover:text-cream-soft"
                    >
                      <span className="font-mono text-label-sm text-cream/45 transition-colors group-hover:text-gold">
                        {i + 1}
                      </span>
                      {option.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-center font-mono text-label-sm uppercase text-cream/50">
                Pick one to begin — nothing to sign up for
              </p>
            </div>
          </Reveal>
        </div>

        {/* --------------------------------------------- formula preview */}
        {/* The one shimmer moment on the page — this is the highest-intent
            card, so it earns the only travelling light. */}
        <Reveal className="mt-16 block lg:mt-20">
          <ShimmerFrame>
            <OrnateFrame
              inset={9}
              className="flex flex-col gap-10 rounded-3xl border border-cream/12 bg-gradient-to-br from-cream/6 to-transparent p-9 sm:p-11 lg:flex-row lg:items-center lg:gap-14"
            >
              {/* The cap and neck are drawn above the element box, so the
                  wrapper needs headroom or they read as a clipped stub. */}
              <div className="flex shrink-0 justify-center pt-11 text-gold-soft/70 lg:px-6">
                <Vial fill={82} bands={{ top: 28, heart: 42, base: 30 }} />
              </div>

              <div className="min-w-0 flex-1">
                <Eyebrow tone="gold">
                  What a finished formula looks like
                </Eyebrow>

                <div className="mt-5 flex flex-col">
                  {EXAMPLE.map((row) => (
                    <div
                      key={row.role}
                      className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-cream/10 py-3.5 last:border-0"
                    >
                      <span className="w-16 shrink-0 font-mono text-label-sm uppercase text-rose">
                        {row.role}
                      </span>
                      <span className="min-w-0 flex-1 text-[14.5px] text-cream/85">
                        {row.materials.map((m) => m.name).join(" · ")}
                      </span>
                      <span className="font-mono text-meta text-gold-soft">
                        {row.pct}%
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-meta italic text-cream/60">
                  {EXAMPLE[0].materials[0]?.desc &&
                    `“${EXAMPLE[0].materials[0].name} — ${EXAMPLE[0].materials[0].desc}.”`}
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
