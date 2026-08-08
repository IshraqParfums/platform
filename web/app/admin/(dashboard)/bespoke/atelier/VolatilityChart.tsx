"use client";

/**
 * One coloured, named line per material, over twenty-four hours on skin.
 *
 * Colour starts from the material's dominant scent family — the same
 * FAMILY_PALETTE the prisms and the bespoke reveal use, so a green top note
 * is the same green here as everywhere else. But family alone is not enough
 * to tell lines apart: a formula with Bacdanol and Cedarwood in it has two
 * woods, and two identical golds. So each material gets a distinct *variant*
 * of its family's hue — the family still reads at a glance, and no two lines
 * in a formula share a colour.
 *
 * Every line is also labelled where it ends, with a leader from the curve to
 * the text, because colour alone is a memory test. Labels are pushed apart
 * vertically when they would collide.
 *
 * The filled area behind is the sum: how much is in the air overall.
 */

import { useId } from "react";

import {
  BESPOKE_FAMILY_PALETTE as FAMILY_PALETTE,
  MAX_HOURS,
  TIME_TICKS,
  timeToFraction,
  type AtelierMaterial,
  type VolatilityModel,
} from "@ishraqparfums/shared";

const W = 880;
const H = 300;
/** The right pad is label gutter, not whitespace. */
const PAD = { top: 14, right: 168, bottom: 26, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const LABEL_SIZE = 10.5;
const LABEL_MIN_GAP = 13;
const NEUTRAL = "#9C8FA0";

/* ------------------------------------------------------------- colour ---- */

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360 / 360;
  function channel(p: number, q: number, t: number) {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(channel(p, q, hue + 1 / 3))}${to(channel(p, q, hue))}${to(channel(p, q, hue - 1 / 3))}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function familyBase(family: string | null): string {
  if (family && family in FAMILY_PALETTE) {
    return FAMILY_PALETTE[family as keyof typeof FAMILY_PALETTE].accent;
  }
  return NEUTRAL;
}

/**
 * Both the line and its label are drawn in this colour on a near-black
 * ground, so anything below roughly 45% lightness stops being readable —
 * several family accents (animalic, earthy, aura-side woods) sit under
 * that on their own. Lift without touching hue.
 */
const MIN_LIGHTNESS = 0.46;
const MAX_LIGHTNESS = 0.8;

function legible(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (l >= MIN_LIGHTNESS) return hex;
  return hslToHex(h, s, MIN_LIGHTNESS);
}

/**
 * A colour per material: family hue, then spread within the family so
 * several woods stay recognisably woody without becoming the same line.
 * Stable for a given set — driven by each material's position among its
 * own family, not by render order.
 *
 * Lightness is spread across a fixed legible band rather than scaled from
 * the family's own lightness: scaling a dark accent downwards produced
 * variants that were technically distinct and practically invisible.
 */
export function buildColourMap(materials: AtelierMaterial[]): Map<string, string> {
  const byFamily = new Map<string, AtelierMaterial[]>();
  for (const m of materials) {
    const key = m.primaryFamily ?? "none";
    const list = byFamily.get(key);
    if (list) list.push(m);
    else byFamily.set(key, [m]);
  }

  const out = new Map<string, string>();
  for (const [family, list] of byFamily) {
    const base = familyBase(family === "none" ? null : family);
    if (list.length === 1) {
      out.set(list[0].id, legible(base));
      continue;
    }
    const { h, s } = hexToHsl(base);
    list.forEach((m, i) => {
      const t = i / (list.length - 1); // 0 → 1 across the family
      out.set(
        m.id,
        hslToHex(
          h + (t - 0.5) * 30, // ±15° of hue keeps the family recognisable
          clamp(s * (1.08 - t * 0.3), 0.2, 0.95),
          MIN_LIGHTNESS + t * (MAX_LIGHTNESS - MIN_LIGHTNESS),
        ),
      );
    });
  }
  return out;
}

/** Names run long ("Bergamot INDI (reconstitution) - dsm-firmenich"). */
export function shortLabel(name: string): string {
  const trimmed = name.split(" (")[0].split(" - ")[0].trim();
  return trimmed.length > 20 ? `${trimmed.slice(0, 19)}…` : trimmed;
}

/* -------------------------------------------------------------- chart ---- */

function pointAt(value: number, hours: number, scale: number) {
  return {
    x: PAD.left + timeToFraction(hours) * PLOT_W,
    y: PAD.top + PLOT_H - (value / scale) * PLOT_H,
  };
}

function path(points: number[], times: number[], scale: number): string {
  return points
    .map((value, i) => {
      const { x, y } = pointAt(value, times[i], scale);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

interface Label {
  id: string;
  text: string;
  colour: string;
  /** Where the curve actually ends — the leader starts here. */
  anchorX: number;
  anchorY: number;
  /** Where the text sits after de-collision. */
  y: number;
}

/**
 * Push labels apart so none overlap, keeping them as close to their curve as
 * the space allows. Sort by preferred position, walk down enforcing a
 * minimum gap, then walk back up if the last one has run off the bottom.
 */
function deCollide(labels: Label[]): Label[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const gap = Math.min(LABEL_MIN_GAP, sorted.length > 1 ? PLOT_H / (sorted.length - 1) : LABEL_MIN_GAP);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < gap) sorted[i].y = sorted[i - 1].y + gap;
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].y - (PAD.top + PLOT_H) : 0;
  if (overflow > 0) {
    for (const label of sorted) label.y -= overflow;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i + 1].y - sorted[i].y < gap) sorted[i].y = sorted[i + 1].y - gap;
    }
  }
  for (const label of sorted) label.y = clamp(label.y, PAD.top + 4, PAD.top + PLOT_H);
  return sorted;
}

export function VolatilityChart({
  model,
  colours,
  highlightId,
  normalize = false,
}: {
  model: VolatilityModel;
  /** materialId → line colour, from buildColourMap. */
  colours: Map<string, string>;
  /** Dims every other line, for hovering a row in the formula table. */
  highlightId?: string | null;
  /**
   * Scale every line to its own peak instead of to the blend's.
   *
   * By contribution, a trace material is a flat line on the floor — true,
   * and useless if what you want to know is when it fades. Normalising
   * throws away "how much" to show "how long", which is the other half of
   * the question.
   */
  normalize?: boolean;
}) {
  const gradientId = useId();
  const { times, series, total, peak } = model;

  const areaPath =
    `${path(total, times, peak)} L${(PAD.left + PLOT_W).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)}` +
    ` L${PAD.left.toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} Z`;

  // Anchor each label where its curve stops being worth following.
  const labels: Label[] = series.map((s) => {
    const scale = normalize ? Math.max(...s.points, 1e-9) : peak;
    const cutoff = Math.max(...s.points) * 0.02;
    let index = s.points.length - 1;
    while (index > 0 && s.points[index] <= cutoff) index -= 1;
    const { x, y } = pointAt(s.points[index], times[index], scale);
    return {
      id: s.material.id,
      text: shortLabel(s.material.name),
      colour: colours.get(s.material.id) ?? familyBase(s.material.primaryFamily),
      anchorX: x,
      anchorY: y,
      y,
    };
  });
  const placed = deCollide(labels);
  const gutterX = PAD.left + PLOT_W + 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Perceived intensity of each material over twenty-four hours on skin"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9963e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c9963e" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD.left}
          x2={PAD.left + PLOT_W}
          y1={PAD.top + PLOT_H - f * PLOT_H}
          y2={PAD.top + PLOT_H - f * PLOT_H}
          stroke="rgba(246,236,220,0.08)"
          strokeWidth="1"
        />
      ))}

      {TIME_TICKS.map((tick) => {
        const x = PAD.left + timeToFraction(tick.hours) * PLOT_W;
        return (
          <g key={tick.label}>
            <line
              x1={x}
              x2={x}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="rgba(246,236,220,0.06)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(246,236,220,0.42)"
              fontFamily="ui-monospace, monospace"
            >
              {tick.label}
            </text>
          </g>
        );
      })}

      <text x={6} y={PAD.top + 8} fontSize="9" fill="rgba(246,236,220,0.35)" fontFamily="ui-monospace, monospace">
        loud
      </text>
      <text x={6} y={PAD.top + PLOT_H} fontSize="9" fill="rgba(246,236,220,0.35)" fontFamily="ui-monospace, monospace">
        gone
      </text>

      {/* The blend's overall volume only means something on the shared scale. */}
      {series.length > 0 && !normalize && <path d={areaPath} fill={`url(#${gradientId})`} />}

      {series.map((s) => {
        const dimmed = highlightId != null && highlightId !== s.material.id;
        const scale = normalize ? Math.max(...s.points, 1e-9) : peak;
        return (
          <path
            key={s.material.id}
            d={path(s.points, times, scale)}
            fill="none"
            stroke={colours.get(s.material.id) ?? familyBase(s.material.primaryFamily)}
            strokeWidth={highlightId === s.material.id ? 2.8 : 1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={dimmed ? 0.15 : 0.95}
          />
        );
      })}

      {/* leaders + names, so no line depends on colour memory alone */}
      {placed.map((label) => {
        const dimmed = highlightId != null && highlightId !== label.id;
        return (
          <g key={label.id} opacity={dimmed ? 0.25 : 1}>
            <path
              d={`M${label.anchorX.toFixed(1)},${label.anchorY.toFixed(1)} L${(gutterX - 5).toFixed(1)},${label.y.toFixed(1)}`}
              fill="none"
              stroke={label.colour}
              strokeWidth="0.9"
              strokeDasharray="2 2"
              opacity="0.55"
            />
            <circle cx={label.anchorX} cy={label.anchorY} r="2.4" fill={label.colour} />
            <text
              x={gutterX}
              y={label.y + LABEL_SIZE * 0.35}
              fontSize={LABEL_SIZE}
              fill={label.colour}
              fontFamily="ui-sans-serif, system-ui"
              fontWeight={highlightId === label.id ? 700 : 500}
            >
              {label.text}
            </text>
          </g>
        );
      })}

      {series.length === 0 && (
        <text
          x={PAD.left + PLOT_W / 2}
          y={H / 2}
          textAnchor="middle"
          fontSize="12"
          fill="rgba(246,236,220,0.3)"
          fontFamily="ui-sans-serif, system-ui"
        >
          Add a material to see how it behaves
        </text>
      )}
    </svg>
  );
}

export { MAX_HOURS };
