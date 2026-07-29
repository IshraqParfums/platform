import type { BespokeAxis } from "@ishraqparfums/shared";
import { MATERIAL_POOL } from "@ishraqparfums/shared";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

/** Anchors each material to its scent family — derived from real data, not decoration. */
const AXIS_COLOR: Record<BespokeAxis, string> = {
  citrus: "#D3A044",
  green: "#7C8B6F",
  aquatic: "#7E9AA6",
  floral: "#C6685A",
  woody: "#8A5A2E",
  amber: "#C9963E",
  gourmand: "#B9793F",
  spicy: "#A84E42",
  powdery: "#C3A08C",
  musk: "#9A7D68",
  smoky: "#5E4535",
};

const SHOWCASE = [
  "Bergamot",
  "Pinkpepper",
  "Cardamom Oil RCO",
  "Hedione",
  "Jasmine Sambac",
  "Methyl Ionone Gamma",
  "Cedarwood",
  "Vetiver EO",
  "Iso E Super",
  "Labdanum Resinoid",
  "Ambroxan 10%",
  "Frankincense",
  "Oud Oliffac",
  "Safraleine",
  "Cashmeran",
  "Coumarin",
];

const ITEMS = SHOWCASE.map((name) =>
  MATERIAL_POOL.find((m) => m.name === name),
).filter((m): m is (typeof MATERIAL_POOL)[number] => Boolean(m));

function Chips() {
  return (
    <>
      {ITEMS.map((material) => (
        <li key={material.name} className="shrink-0 px-2.5">
          <span className="flex items-center gap-3 rounded-full border border-line/70 bg-card px-5 py-3">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: AXIS_COLOR[material.axis] }}
            />
            <span className="font-display text-[16px] font-semibold text-ink">
              {material.name}
            </span>
            <span className="text-meta italic text-ink-soft">
              {material.desc}
            </span>
          </span>
        </li>
      ))}
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
            {MATERIAL_POOL.length} real perfumery materials — the same ones your
            bespoke formula is built from.
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
