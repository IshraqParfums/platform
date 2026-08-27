import { ButtonLink } from "@/components/ui/button";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { cn } from "@/lib/cn";
import { HOME_HERO } from "@/lib/content/home-v2";

/**
 * Shared hero copy for every breakpoint.
 *
 * Type scales hard below lg so phone and tablet read as an editorial hero,
 * not a narrow content column. The heading is allowed to run into the wash
 * fade; the lead stays narrower so it remains on solid parchment.
 */
export function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <p className="text-[12px] text-graphite-soft md:text-[13px]">
        {HOME_HERO.eyebrow}
      </p>

      <Urdu
        size="md"
        tone="brass"
        align="start"
        leading="tight"
        className="mt-3"
      >
        {HOME_HERO.urdu}
      </Urdu>

      <h1 className="mt-3 font-editorial text-[clamp(44px,11.2vw,50px)] leading-[0.96] tracking-[-0.03em] text-graphite md:mt-4 md:text-[clamp(56px,8.4vw,76px)] md:leading-[0.95] lg:mt-4 lg:text-h1-editorial lg:leading-[1.02] lg:tracking-[var(--text-h1-editorial--letter-spacing)]">
        {HOME_HERO.headline[0]}
        <br />
        {HOME_HERO.headline[1]}
      </h1>

      <p className="mt-4 max-w-[26ch] text-[14px] leading-[1.4] text-graphite-soft md:mt-5 md:max-w-[30ch] md:text-[16px] md:leading-[1.45] lg:mt-6 lg:max-w-[38ch] lg:text-[17px] lg:leading-[1.55]">
        {HOME_HERO.lead}
      </p>

      {/*
        min-[420px]+: an auto-cols-fr grid, not flex — with no defined
        container width, equal `fr` tracks size to the widest cell's content,
        so both pills match the longer label's width instead of hugging their
        own text. Stays a plain stacked flex-col (full width each) below
        420px, where matching widths doesn't apply.
      */}
      <div className="mt-7 flex flex-col gap-3 min-[420px]:inline-grid min-[420px]:grid-flow-col min-[420px]:auto-cols-fr md:mt-8 lg:mt-9">
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
