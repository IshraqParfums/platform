"use client";

/**
 * The prism: a radar chart of an accord's (or perfume's) ten-axis scent
 * profile — floral, woody, spicy, and so on. Where the Atelier's
 * VolatilityChart shows how a formula behaves over time, this shows what
 * it's made of: which families dominate and by how much, at a glance.
 *
 * Colour is derived from the dominant axis rather than passed in, so the
 * same family always reads as the same hue everywhere it appears — a woody
 * accord and a woody perfume both read amber-brown, whether you're looking
 * at one entry's own page or scanning fifty cards in the library's list.
 *
 * Ported from Bespoke's web/components/ScentPrism.tsx, repointed at the
 * house's already-shared BESPOKE_DIMENSIONS/BESPOKE_FAMILY_COLOR palette
 * (packages/shared) instead of Bespoke's own lib/bespoke/types +
 * family-colors — same values, this app's existing source of truth for them.
 */

import { BESPOKE_DIMENSIONS, BESPOKE_FAMILY_COLOR, type BespokeDimension } from "@ishraqparfums/shared";

export type ScentVector = Record<BespokeDimension, number>;

const LABEL: Record<BespokeDimension, string> = {
  floral: "Floral",
  woody: "Woody",
  spicy: "Spicy",
  green: "Green",
  aldehydic: "Aldehydic",
  gourmand: "Gourmand",
  animalic: "Animalic",
  earthy: "Earthy",
  citrus: "Citrus",
  musky: "Musky",
};

/** Highest axis value seen across the library (accords currently run up to
 *  5, perfumes to 4) plus headroom, so no shape ever clips the outer ring. */
const MAX_AXIS = 5;

function dominantDimension(vector: Partial<ScentVector>): BespokeDimension | null {
  let best: BespokeDimension | null = null;
  let bestVal = 0;
  for (const dim of BESPOKE_DIMENSIONS) {
    const v = vector[dim] ?? 0;
    if (v > bestVal) {
      best = dim;
      bestVal = v;
    }
  }
  return best;
}

function topDimensions(vector: ScentVector, n: number): BespokeDimension[] {
  return [...BESPOKE_DIMENSIONS]
    .filter((d) => (vector[d] ?? 0) > 0)
    .sort((a, b) => (vector[b] ?? 0) - (vector[a] ?? 0))
    .slice(0, n);
}

function axisPoint(index: number, fraction: number, cx: number, cy: number, r: number): [number, number] {
  const angle = (Math.PI * 2 * index) / BESPOKE_DIMENSIONS.length - Math.PI / 2;
  return [cx + Math.cos(angle) * r * fraction, cy + Math.sin(angle) * r * fraction];
}

/**
 * Most vectors here are sparse — 2 or 3 of the ten axes set, the rest zero.
 * Mapped straight to radius, every zero axis lands exactly on the centre
 * point, so the "polygon" is really just one or two spikes through a single
 * point — a line, not a shape. A small floor gives every axis a point off
 * centre, so the outline is always a real decagon that bulges toward what's
 * set rather than a sliver.
 */
const AXIS_FLOOR = 0.16;

function axisFraction(value: number): number {
  const clamped = Math.max(0, Math.min(value, MAX_AXIS));
  return AXIS_FLOOR + (1 - AXIS_FLOOR) * (clamped / MAX_AXIS);
}

function polygonPoints(vector: ScentVector, cx: number, cy: number, r: number): string {
  return BESPOKE_DIMENSIONS.map((dim, i) => {
    const fraction = axisFraction(vector[dim] ?? 0);
    const [x, y] = axisPoint(i, fraction, cx, cy, r);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

/**
 * Small, unlabelled polygon for scanning many cards at once — the library's
 * list view, one per accord or perfume. Colour alone carries the dominant
 * family; nothing here needs to be read precisely.
 */
export function ScentPrismMini({ vector, className = "" }: { vector: ScentVector; className?: string }) {
  const size = 40;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const color = BESPOKE_FAMILY_COLOR[dominantDimension(vector) ?? "woody"];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden className={className}>
      {[0.5, 1].map((ring) => (
        <polygon
          key={ring}
          points={BESPOKE_DIMENSIONS.map((_, i) => axisPoint(i, ring, cx, cy, r).join(",")).join(" ")}
          fill="none"
          stroke="rgba(246,236,220,0.12)"
          strokeWidth={0.75}
        />
      ))}
      <polygon
        points={polygonPoints(vector, cx, cy, r)}
        fill={`color-mix(in srgb, ${color} 45%, transparent)`}
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full chart — the chart itself plus a legend of every non-zero axis, so the
 * shape (glanceable) and the exact numbers (checkable) are both on screen.
 * The legend also stands in as the accessible alternative: the SVG is
 * decorative, the legend is the actual data.
 */
export function ScentPrism({ vector, className = "" }: { vector: ScentVector; className?: string }) {
  const width = 320;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const r = 76;
  const labelR = r * 1.3;
  const dominant = dominantDimension(vector);
  const color = BESPOKE_FAMILY_COLOR[dominant ?? "woody"];
  const top = topDimensions(vector, 2);
  const nonZero = topDimensions(vector, BESPOKE_DIMENSIONS.length);

  return (
    <div className={`flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={top.length ? `Scent profile, led by ${top.map((d) => LABEL[d]).join(" and ")}` : "Scent profile"}
      >
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={BESPOKE_DIMENSIONS.map((_, i) => axisPoint(i, ring, cx, cy, r).join(",")).join(" ")}
            fill="none"
            stroke="rgba(246,236,220,0.09)"
            strokeWidth={1}
          />
        ))}
        {BESPOKE_DIMENSIONS.map((_, i) => {
          const [x, y] = axisPoint(i, 1, cx, cy, r);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(246,236,220,0.09)" strokeWidth={1} />;
        })}
        <polygon
          points={polygonPoints(vector, cx, cy, r)}
          fill={`color-mix(in srgb, ${color} 26%, transparent)`}
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />
        {BESPOKE_DIMENSIONS.map((dim, i) => {
          const [lx, ly] = axisPoint(i, labelR / r, cx, cy, r);
          const angle = (Math.PI * 2 * i) / BESPOKE_DIMENSIONS.length - Math.PI / 2;
          const cos = Math.cos(angle);
          const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
          return (
            <text
              key={dim}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="font-mono"
              style={{ fontSize: 9, letterSpacing: "0.08em", fill: "rgba(246,236,220,0.4)", textTransform: "uppercase" }}
            >
              {LABEL[dim]}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f6ecdc]/55">
          {top.length ? `Led by ${top.map((d) => LABEL[d]).join(" · ")}` : "No dominant family"}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {nonZero.map((dim) => (
            <li
              key={dim}
              className="rounded-full border px-2.5 py-1 text-xs"
              style={{
                borderColor: `color-mix(in srgb, ${BESPOKE_FAMILY_COLOR[dim]} 45%, rgba(255,255,255,0.12))`,
                color: "rgba(246,236,220,0.85)",
              }}
            >
              {LABEL[dim]} · {vector[dim]}
            </li>
          ))}
          {nonZero.length === 0 && <li className="text-xs text-[#f6ecdc]/55">Flat — no axis is set.</li>}
        </ul>
      </div>
    </div>
  );
}

export default ScentPrism;
