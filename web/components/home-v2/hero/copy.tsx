import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { HOME_HERO } from "@/lib/content/home-v2";

/**
 * The hero's type.
 *
 * Four beats: kicker, headline, lead, CTAs. The kicker names the house
 * (same micro-uppercase register as Belief, in terra). No hairline under
 * it — that rule only existed to join an Urdu co-headline to the English.
 *
 * Below sm everything is centred: with no panel beside it the type is the
 * entire hero. From sm it runs left off the same rail as the arch.
 */
export function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={cn("text-center sm:text-left", className)}>
      <p
        className="hero-rise font-ui text-micro-sm font-semibold uppercase tracking-[0.24em] text-terra"
        style={{ animationDelay: "0ms" }}
      >
        {HOME_HERO.eyebrow}
      </p>

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
        className="hero-rise mt-4 font-editorial text-[clamp(45.6px,12.48vw,60px)] leading-[0.98] tracking-[-0.03em] text-graphite sm:mt-5 sm:text-[clamp(36px,5.4vw,52px)] sm:leading-[0.96] lg:mt-6 lg:text-h1-editorial lg:leading-[var(--text-h1-editorial--line-height)] lg:tracking-[var(--text-h1-editorial--letter-spacing)]"
        style={{ animationDelay: "80ms" }}
      >
        {HOME_HERO.headline[0]}
        <br />
        {HOME_HERO.headline[1]}
      </h1>

      <p
        className="hero-rise mx-auto mt-4 max-w-[28ch] text-[17.4px] leading-[1.45] text-graphite-soft sm:mx-0 sm:mt-5 sm:max-w-[30ch] sm:text-[15.5px] sm:leading-[1.5] lg:mt-6 lg:max-w-[36ch] lg:text-[17px] lg:leading-[1.55]"
        style={{ animationDelay: "160ms" }}
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
        style={{ animationDelay: "240ms" }}
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
