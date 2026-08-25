import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { HOME_HERO } from "@/lib/content/home-v2";
import { HEADER_HEIGHT_PX } from "@/lib/layout";

/**
 * Type-first opening. No photograph.
 *
 * A rose, a trunk, a tray of spices: those belong as atmosphere on a mood
 * board, not as the first thing a shopper has to scroll past to reach a bottle.
 * The first images on this page are products, in the shelf directly below.
 * Mobile especially cannot afford a 300px still-life before the value prop.
 *
 * Padding-top clears the fixed header; the block itself is not viewport-tall.
 * A full-viewport hero would push the bottles below the fold, which is the
 * opposite of a buying page.
 */
export function HeroV2() {
  return (
    <section className="relative z-[1]">
      <BandInner>
        <div
          className="max-w-[720px] pb-12 sm:pb-16 lg:pb-20"
          style={{ paddingTop: HEADER_HEIGHT_PX + 32 }}
        >
          <Urdu
            size="lg"
            className="text-[22px] sm:text-[26px] lg:text-[28px]"
          >
            {HOME_HERO.urdu}
          </Urdu>

          <h1 className="mt-2 pb-1 font-editorial text-h1-editorial leading-[1.1] text-graphite text-pretty">
            {HOME_HERO.headlineLead}{" "}
            <em className="italic">{HOME_HERO.headlineEmphasis}</em>{" "}
            {HOME_HERO.headlineTail}
          </h1>

          <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.6] text-graphite-soft text-pretty sm:text-[18px]">
            {HOME_HERO.lead}
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <ButtonLink
              href={HOME_HERO.primaryCta.href}
              variant="indigo"
              size="pill"
            >
              {HOME_HERO.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={HOME_HERO.secondaryCta.href}
              variant="outline-ink"
              size="pill"
            >
              {HOME_HERO.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </BandInner>
    </section>
  );
}
