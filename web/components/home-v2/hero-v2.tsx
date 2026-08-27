import { HeroCopy } from "@/components/home-v2/hero/copy";
import { HeroVisual } from "@/components/home-v2/hero/visual";
import { BandInner } from "@/components/home-v2/ui/band";

/**
 * Arrival composition — one photograph, two readings.
 *
 * Below lg: stacked, not overlaid. The photo runs full-bleed on top, sized
 * by viewport height rather than a fixed aspect ratio, then copy follows on
 * solid paper. A fixed `aspect-[4/5]` used to size purely off width — fine
 * on a narrow phone, but a tablet-width viewport (e.g. 820px) isn't
 * proportionally taller, so the same ratio produced a 1000px+ image that
 * swallowed the screen before any type appeared. Height caps that shrink as
 * width grows (`56vh` phone, `44vh` sm+) keep the photo from ever eating
 * more of the viewport than it should, on any width in this range. A prior
 * version also tried holding the photo full-bleed *behind* the copy with a
 * left-to-right parchment fade — on a narrow, tall viewport that fade had to
 * cover more than half the width to keep type legible, which buried most of
 * the photo under opaque parchment no matter how the crop was tuned.
 *
 * lg+: asymmetric split (~55% type / ~45% visual), unchanged. Type on ivory;
 * the material enters from the right edge.
 */
export function HeroV2() {
  return (
    <section className="relative bg-paper">
      <div className="lg:relative lg:grid lg:min-h-[100dvh] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <HeroVisual
          priority
          className="relative h-[56vh] w-full overflow-hidden sm:h-[44vh] lg:h-auto lg:min-h-[100dvh] lg:col-start-2 lg:row-start-1"
        />

        {/*
          Below lg: plain top-to-bottom flow, no forced height or centering —
          the block is exactly as tall as its content.
          lg only: `pt-20`/`pb-16` (not equal) net-centers the column a touch
          below true middle, clearing the fixed header (68px + 12px —
          HEADER_HEIGHT_PX in lib/layout.ts — is exactly `pt-20`'s 80px).
        */}
        <BandInner className="relative z-[1] pt-10 pb-14 sm:pt-12 sm:pb-16 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-center lg:pt-20 lg:pb-16 lg:pr-12">
          <HeroCopy className="w-full lg:w-auto lg:max-w-none" />
        </BandInner>
      </div>
    </section>
  );
}
