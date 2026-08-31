import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  BESPOKE_TEASER_MATERIALS,
  type BespokeDimension,
} from "@ishraqparfums/shared";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

const SHOWCASE = BESPOKE_TEASER_MATERIALS;

/** Cycle family accents across the marquee — decorative, not per-material axis. */
const ACCENT_CYCLE = Object.keys(BESPOKE_FAMILY_COLOR) as BespokeDimension[];

function Chips() {
  return (
    <>
      {SHOWCASE.map((name, index) => {
        const dim = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
        return (
          <li key={name} className="shrink-0 px-2.5">
            <span className="flex items-center gap-3 rounded-full border border-line/70 bg-card px-5 py-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: BESPOKE_FAMILY_COLOR[dim] }}
              />
              <span className="font-display text-[16px] font-semibold text-ink">
                {name}
              </span>
              <span className="text-meta italic text-ink-soft">
                {BESPOKE_DIMENSION_LABEL[dim]}
              </span>
            </span>
          </li>
        );
      })}
    </>
  );
}

export function PaletteMarquee() {
  return (
    <Section tone="cream-soft" space="compact" bordered>
      <Container size="wide">
        <div className="flex flex-col gap-4 text-center">
          <Eyebrow className="mx-auto">The perfumer&apos;s palette</Eyebrow>
          <p className="font-display mx-auto max-w-2xl text-subsection font-semibold text-ink">
            Real perfumery materials: the same stock your bespoke match is
            drawn from.
          </p>
        </div>
      </Container>

      <div
        className="marquee-host relative mt-12 overflow-hidden"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-cream-soft to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-cream-soft to-transparent" />

        <ul className="marquee-track flex w-max items-center">
          <Chips />
          <Chips />
        </ul>
      </div>
    </Section>
  );
}
