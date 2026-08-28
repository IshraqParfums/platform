import { HeroAperture } from "@/components/home-v2/hero/aperture";
import { HeroCopy } from "@/components/home-v2/hero/copy";
import { BandInner } from "@/components/home-v2/ui/band";

/**
 * Arrival composition — a window at first light.
 *
 * The page ground stays parchment top to bottom, which is not a stylistic
 * preference but a constraint: the header renders its light glass bar on `/`,
 * and graphite-on-paper/70 over a dark photograph is unreadable. So the
 * photograph is always an inset in the paper, never the ground under it.
 *
 * Two compositions, switching at `sm`:
 *
 *   below sm — one viewport, centred. The type is the whole hero: the Urdu
 *     line and its English twin either side of a short rule, and the
 *     photograph dissolved into the parchment behind them with no edges at
 *     all. Nothing here is a panel, so nothing has to be fitted around one.
 *   sm+ — 100dvh, left-aligned. The photograph becomes the arch: flush right
 *     against the container's own rail, standing on the section floor and
 *     rising past the header's line, with the type beside it.
 *
 * That switch is the responsive fix. Holding one layout across the range is
 * what broke: the phone stack marooned a 220px arch in the middle of a 900px
 * screen with dead space under it, and needed scrolling on the short
 * viewports (~660px) that laptop browser windows actually have. Those widths
 * have width to spend and no height to spare, which is the case a side-by-
 * side solves and a stack does not — and a phone is the exact opposite,
 * which is why it gets no panel at all.
 *
 * STRUCTURE. Two independent layers, each aligned by its own `BandInner`,
 * rather than one grid holding both. The grid version collapsed the arch to
 * the 16px of its own frame overhang, and the reason generalises: the
 * photograph has to be out of flow and full-bleed below sm but in the layout
 * and on the rail above it. Anything that resolves that by switching
 * `position` on one element leaves its children resolving `top`/`bottom`
 * against a box whose height is only defined at one of the two breakpoints.
 * Layering sidesteps it — the photograph is absolute at every width, the
 * type is in flow at every width, and neither sizes the other. Sharing
 * `BandInner` is what keeps the arch on the same rail as the type, and as
 * Materials, Collection and Belief below.
 */
export function HeroV2() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-paper">
      <div className="absolute inset-0">
        <BandInner className="relative h-full">
          {/*
            Below sm: full bleed. `inset-0` spans the band's padding box, so
            the field runs edge to edge on a phone rather than stopping at
            the gutters.
            From sm: pinned to the band's right rail, floor-standing at
            `bottom-0`, and starting far enough down that its shoulders clear
            the 68px header at any height.
          */}
          <HeroAperture
            priority
            className="absolute inset-0 sm:bottom-0 sm:left-auto sm:right-0 sm:top-[16%] sm:w-[min(34vw,300px)] lg:top-[14%] lg:w-[min(32vw,430px)]"
          />
        </BandInner>
      </div>

      {/*
        Below sm the band centres the type in the viewport, and `pt-[68px]`
        pushes that centre clear of the fixed header. From sm, `pt-20`/`pb-16`
        (not equal) net-centres it a touch below true middle for the same
        reason — 68px + 12px (HEADER_HEIGHT_PX in lib/layout.ts) is exactly
        `pt-20`'s 80px.
      */}
      <BandInner className="relative z-[1] flex min-h-[100svh] flex-col justify-center pt-[68px] pb-8 sm:pt-20 sm:pb-16">
        {/*
          The type's measure is the band less the arch, worked out from the
          same tokens the arch is placed with so the two can never disagree.
          `100%` here is the band's content box, while the arch is pinned to
          its padding box, which is where the leading `+` term comes from: it
          adds back the gutter the arch is sitting in before subtracting the
          arch itself and a clear gap.
        */}
        <HeroCopy className="sm:max-w-[calc(100%+0.5rem-min(34vw,300px))] lg:max-w-[calc(100%+1rem-min(32vw,430px))]" />
      </BandInner>
    </section>
  );
}
