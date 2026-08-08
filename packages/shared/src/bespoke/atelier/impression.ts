/**
 * What the thing you just built actually feels like.
 *
 * Every other panel in the Atelier answers a technical question — how long
 * will it last, what is it made of, will these two melt together. None of
 * them answer the one you actually want answered at the bench, which is
 * "what have I made". This does, and it does it without inventing anything:
 * every word and every colour here is derived from a field the palette
 * already carries.
 *
 *   colour       BESPOKE_FAMILY_PALETTE hues, mixed by how much each family is
 *                contributing at that moment. The same hues the retail
 *                bottles and the bespoke reveal use, so a green top note is
 *                the same green everywhere.
 *   temperature  the palette's own -4 (cold) to +4 (hot) per material,
 *                weighted by contribution
 *   weight       the palette's own `polarity`, -3 (transparent) to +4
 *                (resinous), which in practice reads as how heavy the air is
 *   facets       the canonical facet vocabulary, weighted by contribution
 *   emotion      the palette's authored emotion words, weighted the same way
 *   the line     the lead material's own `odour`, verbatim
 *
 * Everything is computed at three moments rather than once, because a
 * perfume is not one smell — the whole point of the arc is that the opening
 * and the drydown disagree, and a single averaged description would hide
 * exactly the thing worth knowing.
 */

import type { FacetLexicon } from "./affinity.js";
import type { AtelierCataloguePerfume as CataloguePerfume } from "../atelier-contracts.js";
import { BESPOKE_FAMILY_PALETTE } from "../palette.js";
import { BESPOKE_DIMENSIONS, type BespokeDimension } from "../palette.js";
import {
  contributionAt,
  estimatedWearHours,
  MAX_HOURS,
  type AtelierMaterial,
  type FormulaRow,
  type VolatilityModel,
} from "./volatility.js";

/* ------------------------------------------------------------------ types */

export interface ImpressionAct {
  key: "opening" | "heart" | "drydown";
  label: string;
  /** When this act is read. */
  hours: number;
  /** Blended family colour at that moment. */
  colour: string;
  dominant: { material: AtelierMaterial; share: number }[];
  facets: { facet: string; weight: number }[];
  temperature: number;
  weight: number;
  /** The lead material's own odour description, verbatim. Empty if silent. */
  line: string;
  /** True when nothing is left in the air. */
  silent: boolean;
}

export interface NearestPerfume {
  id: string;
  name: string;
  collection?: string;
  similarity: number;
}

export interface Impression {
  acts: ImpressionAct[];
  /** Colour samples across the wearing, for the ribbon. */
  ribbon: { hours: number; colour: string }[];
  vector: Record<BespokeDimension, number>;
  emotions: { word: string; weight: number }[];
  /** One line describing how it moves from opening to drydown. */
  arc: string;
  nearest: NearestPerfume[];
  wearHours: number;
}

export type { CataloguePerfume };

const ACTS: { key: ImpressionAct["key"]; label: string; hours: number }[] = [
  { key: "opening", label: "The first minute", hours: 0 },
  { key: "heart", label: "An hour in", hours: 1 },
  { key: "drydown", label: "Late, on skin", hours: 8 },
];

const RIBBON_SAMPLES = 48;

/* --------------------------------------------------------------- colour */

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** The colour of the air at one moment: family hues mixed by contribution. */
function blendColour(weights: Partial<Record<BespokeDimension, number>>): string {
  let total = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const dim of BESPOKE_DIMENSIONS) {
    const w = weights[dim] ?? 0;
    if (w <= 0) continue;
    const [cr, cg, cb] = hexToRgb(BESPOKE_FAMILY_PALETTE[dim].accent);
    r += cr * w;
    g += cg * w;
    b += cb * w;
    total += w;
  }
  // Nothing in the air is not black, it is the page — return the house ground
  // so an empty moment reads as absence rather than as a dark colour.
  if (total <= 0) return "#3a2a22";
  return rgbToHex(r / total, g / total, b / total);
}

/* ----------------------------------------------------------- the engine */

/** Family weights across the formula at one instant. */
function familyWeightsAt(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  hours: number,
): { families: Partial<Record<BespokeDimension, number>>; total: number } {
  const families: Partial<Record<BespokeDimension, number>> = {};
  let total = 0;
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m) continue;
    const c = contributionAt(m, row.neatPct, hours);
    if (c <= 0) continue;
    total += c;
    for (const [dim, strength] of Object.entries(m.families) as [BespokeDimension, number][]) {
      families[dim] = (families[dim] ?? 0) + c * strength;
    }
  }
  return { families, total };
}

function actAt(
  key: ImpressionAct["key"],
  label: string,
  hours: number,
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  lexicon: FacetLexicon,
): ImpressionAct {
  const present: { material: AtelierMaterial; value: number }[] = [];
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m) continue;
    const value = contributionAt(m, row.neatPct, hours);
    if (value > 0) present.push({ material: m, value });
  }
  present.sort((a, b) => b.value - a.value);
  const total = present.reduce((s, p) => s + p.value, 0);

  const { families } = familyWeightsAt(rows, byId, hours);

  // Facets, weighted by contribution. Secondary facets count for less here
  // than in the affinity engine — this is describing what it smells of, and
  // for that the thing a material leads with is the thing that shows.
  const facetWeights = new Map<string, number>();
  let temperature = 0;
  let weight = 0;
  for (const { material, value } of present) {
    const share = total > 0 ? value / total : 0;
    temperature += material.temperature * share;
    weight += material.polarity * share;
    for (const f of material.facetsPrimary) {
      const canon = lexicon.aliases[f] ?? f;
      facetWeights.set(canon, (facetWeights.get(canon) ?? 0) + value);
    }
    for (const f of material.facetsSecondary) {
      const canon = lexicon.aliases[f] ?? f;
      facetWeights.set(canon, (facetWeights.get(canon) ?? 0) + value * 0.45);
    }
  }

  const facets = [...facetWeights.entries()]
    .map(([facet, w]) => ({ facet, weight: w }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  return {
    key,
    label,
    hours,
    colour: blendColour(families),
    dominant: present.slice(0, 3).map((p) => ({
      material: p.material,
      share: total > 0 ? p.value / total : 0,
    })),
    facets,
    temperature,
    weight,
    line: present[0]?.material.odour ?? "",
    silent: present.length === 0,
  };
}

export function temperatureWord(t: number): string {
  if (t <= -2.2) return "cold";
  if (t <= -0.8) return "cool";
  // Deliberately one word: these go into "Opens ___ and ___, settles ___ and
  // ___", and a phrase like "neither warm nor cool" wrecks the sentence.
  if (t < 0.8) return "neutral";
  if (t < 2.2) return "warm";
  return "hot";
}

export function weightWord(w: number): string {
  if (w <= -1.8) return "transparent";
  if (w <= -0.6) return "airy";
  if (w < 0.9) return "even";
  if (w < 2.2) return "dense";
  return "resinous";
}

function buildArc(acts: ImpressionAct[]): string {
  const opening = acts[0];
  const drydown = acts[acts.length - 1];
  if (!opening || opening.silent) return "";
  if (drydown.silent) {
    return `Opens ${temperatureWord(opening.temperature)} and ${weightWord(opening.weight)}, and is gone before the day is.`;
  }
  const sameTemp = temperatureWord(opening.temperature) === temperatureWord(drydown.temperature);
  const sameWeight = weightWord(opening.weight) === weightWord(drydown.weight);
  if (sameTemp && sameWeight) {
    return `Stays ${temperatureWord(opening.temperature)} and ${weightWord(opening.weight)} the whole way through — it does not travel far from where it starts.`;
  }
  return (
    `Opens ${temperatureWord(opening.temperature)} and ${weightWord(opening.weight)}, ` +
    `settles ${temperatureWord(drydown.temperature)} and ${weightWord(drydown.weight)}.`
  );
}

/** Cosine similarity over the 10 dimensions. */
function cosine(
  a: Partial<Record<BespokeDimension, number>>,
  b: Partial<Record<BespokeDimension, number>>,
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const dim of BESPOKE_DIMENSIONS) {
    const x = a[dim] ?? 0;
    const y = b[dim] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function buildImpression(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  model: VolatilityModel,
  lexicon: FacetLexicon,
  catalogue: CataloguePerfume[],
): Impression {
  const acts = ACTS.map((a) => actAt(a.key, a.label, a.hours, rows, byId, lexicon));

  const ribbon: { hours: number; colour: string }[] = [];
  for (let i = 0; i <= RIBBON_SAMPLES; i++) {
    // Square spacing, matching the chart's axis, so the ribbon and the curves
    // above it are showing the same moment at the same x.
    const f = i / RIBBON_SAMPLES;
    const hours = f * f * MAX_HOURS;
    ribbon.push({ hours, colour: blendColour(familyWeightsAt(rows, byId, hours).families) });
  }

  // The blend's own scent vector: family strengths weighted by how much of
  // each material is actually in the air, averaged over the wearing rather
  // than taken at one instant.
  const vector = Object.fromEntries(BESPOKE_DIMENSIONS.map((d) => [d, 0])) as Record<BespokeDimension, number>;
  const emotionWeights = new Map<string, number>();
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m) continue;
    // Mean contribution across the sampled wearing.
    const mean =
      model.times.reduce((s, t) => s + contributionAt(m, row.neatPct, t), 0) /
      Math.max(model.times.length, 1);
    if (mean <= 0) continue;
    for (const [dim, strength] of Object.entries(m.families) as [BespokeDimension, number][]) {
      vector[dim] += mean * strength;
    }
    for (const word of m.emotion) {
      emotionWeights.set(word, (emotionWeights.get(word) ?? 0) + mean);
    }
  }
  const peak = Math.max(...BESPOKE_DIMENSIONS.map((d) => vector[d]), 1e-9);
  for (const dim of BESPOKE_DIMENSIONS) vector[dim] = vector[dim] / peak;

  const emotions = [...emotionWeights.entries()]
    .map(([word, weight]) => ({ word, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  const nearest =
    rows.length === 0
      ? []
      : catalogue
          .map((p) => ({
            id: p.id,
            name: p.name,
            collection: p.collection,
            similarity: cosine(vector, p.profile),
          }))
          .filter((p) => p.similarity > 0)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 3);

  return {
    acts,
    ribbon,
    vector,
    emotions,
    arc: buildArc(acts),
    nearest,
    wearHours: rows.length ? estimatedWearHours(model) : 0,
  };
}
