import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  BESPOKE_TEASER_MATERIALS,
  type BespokeDimension,
} from "@ishraqparfums/shared";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { HOME_MATERIALS } from "@/lib/content/home-v2";

/**
 * The perfumer's palette, running past as a marquee.
 *
 * Same data and same seam trick as `components/home/palette-marquee`: two
 * identical runs of chips in one track, translated exactly -50%, so the loop
 * point always lands on a duplicate.
 *
 * Marked aria-hidden: it is a texture, and a screen reader walking fifteen
 * material names twice is noise. The heading above carries the meaning.
 */
const ACCENT_CYCLE = Object.keys(BESPOKE_FAMILY_COLOR) as BespokeDimension[];

function Chips() {
  return (
    <>
      {BESPOKE_TEASER_MATERIALS.map((name, index) => {
        const dimension = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
        return (
          <li
            key={name}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-graphite/[0.13] bg-shell/60 px-5 py-3"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: BESPOKE_FAMILY_COLOR[dimension] }}
            />
            <span className="text-[14px] font-medium text-graphite">{name}</span>
            <span className="text-[13px] italic text-graphite-faint">
              {BESPOKE_DIMENSION_LABEL[dimension]}
            </span>
          </li>
        );
      })}
    </>
  );
}

export function MaterialsMarquee() {
  return (
    <Band space="compact" className="border-b border-graphite/8">
      <BandInner>
        <h2 className="max-w-2xl font-editorial text-h3-editorial text-graphite text-pretty">
          {HOME_MATERIALS.heading}
        </h2>
      </BandInner>

      <div className="marquee-v2-host mt-8 overflow-hidden" aria-hidden="true">
        <ul className="marquee-v2 flex w-max items-center gap-3.5">
          <Chips />
          <Chips />
        </ul>
      </div>
    </Band>
  );
}
