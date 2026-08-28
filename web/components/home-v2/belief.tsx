import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { HOME_BELIEF } from "@/lib/content/home-v2";

/**
 * Closing statement. Centred rather than left-run like the rest of the
 * page — this is the one place the homepage steps back and speaks plainly,
 * so it reads as a full stop, not another content column.
 */
export function Belief() {
  return (
    <section className="bg-paper-deep py-16 md:py-20 lg:py-24">
      <BandInner className="flex flex-col items-center text-center">
        <div className="mx-auto max-w-[760px]">
          <Reveal>
            <p className="font-ui text-micro-sm font-semibold uppercase tracking-[0.24em] text-graphite-mute">
              {HOME_BELIEF.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <Urdu size="display" align="center" leading="tight" className="mt-3">
              {HOME_BELIEF.urdu}
            </Urdu>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 font-editorial text-[clamp(30px,4.4vw,56px)] leading-[1.14] text-graphite text-pretty">
              {HOME_BELIEF.statement}
            </p>
          </Reveal>

          <Reveal delay={270}>
            <p className="mx-auto mt-7 max-w-[52ch] text-[17px] leading-[1.65] text-graphite-soft">
              {HOME_BELIEF.body}
            </p>
          </Reveal>
        </div>

        <Reveal
          delay={360}
          className="mt-10 flex flex-col gap-3 min-[420px]:flex-row"
        >
          <ButtonLink
            href={HOME_BELIEF.primaryCta.href}
            variant="ink"
            size="pill"
          >
            {HOME_BELIEF.primaryCta.label}
          </ButtonLink>
          <ButtonLink
            href={HOME_BELIEF.secondaryCta.href}
            variant="outline-paper"
            size="pill"
          >
            {HOME_BELIEF.secondaryCta.label}
          </ButtonLink>
        </Reveal>
      </BandInner>
    </section>
  );
}
