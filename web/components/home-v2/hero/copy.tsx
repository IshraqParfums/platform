import { ButtonLink } from "@/components/ui/button";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { cn } from "@/lib/cn";
import { HOME_HERO } from "@/lib/content/home-v2";

/**
 * The hero's type.
 *
 * The Urdu line and the English headline are one sentence twice, so they are
 * set as a matched pair divided by a rule — a translator's rule, the same
 * hairline language the Materials section draws its elbows in. The Urdu used
 * to sit above the headline at 19px, smaller than this page's body copy, and
 * read as ornament; at co-headline scale it reads as the other half of the
 * sentence, which is what it is.
 *
 * Alignment turns twice. Below sm everything is centred on a short rule:
 * with no panel beside it the type is the entire hero, and a centred
 * bilingual pair is a statement rather than a column that happens to start
 * on the left. From sm it runs left off the same rail as the arch. At lg the
 * Urdu alone goes flush right, so its right-to-left line runs toward the
 * aperture beside it while the English runs away from it, and the rule's
 * fade turns with it to point the same way.
 *
 * Four elements, no eyebrow, nothing under the CTAs.
 */
export function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={cn("text-center sm:text-left", className)}>
      <Urdu
        size="hero"
        tone="brass"
        align="center"
        leading="tight"
        className="hero-rise sm:text-left lg:text-right"
      >
        {HOME_HERO.urdu}
      </Urdu>

      {/*
        Clearance, not decoration, sets this top margin. Nastaliq descends
        far below its baseline and `leading="tight"` trims the cushion
        `.urdu` normally carries, so at `mt-4` the tail of "ہے" crossed the
        rule. It scales with the line above it rather than sitting fixed.

        Centred, the rule is a short mark with both ends fading; left-run it
        becomes a long one fading away from the type it belongs to.
      */}
      <span
        aria-hidden="true"
        className="hero-rise mx-auto mt-5 block h-px w-24 bg-[linear-gradient(90deg,transparent,rgba(181,122,25,0.55),transparent)] sm:mx-0 sm:w-full sm:max-w-[22rem] sm:bg-[linear-gradient(90deg,rgba(181,122,25,0.5),rgba(181,122,25,0.14)_62%,transparent)] md:max-w-[26rem] lg:mt-7 lg:max-w-none lg:bg-[linear-gradient(270deg,rgba(181,122,25,0.5),rgba(181,122,25,0.14)_62%,transparent)]"
        style={{ animationDelay: "80ms" }}
      />

      {/*
        Three scales for three column widths, not for three viewport widths.
        Below sm the headline owns the full page measure; from sm it is
        sharing with the arch at 1.25:0.75; at lg the split relaxes and the
        column takes a step down in relative width just as the viewport takes
        a step up, which is why lg needs its own ramp rather than a
        continuation of the one below it. Each is budgeted against Georgia
        (the swap-window fallback), not Instrument Serif — see the
        `--text-h1-editorial` comment in globals.css.
      */}
      <h1
        className="hero-rise mt-5 font-editorial text-[clamp(38px,10.4vw,50px)] leading-[0.98] tracking-[-0.03em] text-graphite sm:mt-6 sm:text-[clamp(36px,5.4vw,52px)] sm:leading-[0.96] lg:mt-7 lg:text-h1-editorial lg:leading-[var(--text-h1-editorial--line-height)] lg:tracking-[var(--text-h1-editorial--letter-spacing)]"
        style={{ animationDelay: "160ms" }}
      >
        {HOME_HERO.headline[0]}
        <br />
        {HOME_HERO.headline[1]}
      </h1>

      <p
        className="hero-rise mx-auto mt-4 max-w-[28ch] text-[14.5px] leading-[1.45] text-graphite-soft sm:mx-0 sm:mt-5 sm:max-w-[30ch] sm:text-[15.5px] sm:leading-[1.5] lg:mt-6 lg:max-w-[36ch] lg:text-[17px] lg:leading-[1.55]"
        style={{ animationDelay: "240ms" }}
      >
        {HOME_HERO.lead}
      </p>

      {/*
        The CTAs go side by side only at xl, and the threshold is measured,
        not guessed. Two pills of these labels need ~455px of row; the type
        column is 382px at a 420px viewport (where an earlier `min-[420px]`
        rule put them in a row, and the secondary label ran off the page),
        340px at sm, and still only 455px at lg — exactly break-even, which
        the Jost fallback would tip over. 1280 is the first width with real
        margin.

        Between sm and xl they stack but shrink to their own labels
        (`items-start`) rather than stretching the column. Below sm they stay
        full width: on a phone that is the tap target, and two centred pills
        of unequal width under centred type would read as ragged.
      */}
      <div
        className="hero-rise mt-6 flex flex-col gap-3 sm:mt-7 sm:items-start lg:mt-8 xl:inline-grid xl:grid-flow-col xl:auto-cols-fr"
        style={{ animationDelay: "330ms" }}
      >
        <ButtonLink href={HOME_HERO.primaryCta.href} variant="ink" size="pill">
          {HOME_HERO.primaryCta.label}
        </ButtonLink>
        <ButtonLink
          href={HOME_HERO.secondaryCta.href}
          variant="outline-paper"
          size="pill"
        >
          {HOME_HERO.secondaryCta.label}
        </ButtonLink>
      </div>
    </div>
  );
}
