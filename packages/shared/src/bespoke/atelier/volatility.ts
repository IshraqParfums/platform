/**
 * How a formula behaves on skin over time.
 *
 * Every material in data/materials.json carries the three fields this needs:
 * `tenacity_hours` (2 to 300 across the palette), `evap_curve` (one of seven
 * named shapes) and `strength` (1–10). So the curves here are derived from
 * the palette's own measured-ish numbers rather than drawn to look plausible.
 *
 * The model is deliberately simple and stated rather than hidden, because a
 * perfumer reading it should be able to tell exactly how much to trust it:
 *
 *   contribution(t) = dose%^n × (strength / 10) × onset(t) × decay(t)
 *   decay(t)        = (1 − t/tenacity)^p   for t < tenacity, else 0
 *   onset(t)        = f0 + (1 − f0)(1 − e^(−3t/t_peak))
 *
 * The exponent `n` on dose is there because the nose is not a linear
 * instrument. Perceived intensity follows roughly the square root of
 * concentration (Stevens' power law; measured exponents for odorants land
 * between about 0.2 and 0.7). A first version of this used n = 1, and the
 * result was that the four highest-dosed materials in the palette — Iso E
 * Super at 21%, Galaxolide at 14%, Hedione at 17%, ethylene brassylate at
 * 11% — came out as the loudest things in every formula at every hour. Those
 * are the four the palette itself describes as "does almost nothing on its
 * own" and "more texture than smell". Dosing something twenty times higher
 * does not make it twenty times louder; it makes it about four and a half
 * times louder, which is exactly why those materials can be dosed that high.
 *
 * `p` comes from the material's own evap_curve, so a "steep-decay" citrus
 * top falls away fast and a "plateau" woody-amber holds nearly flat until it
 * doesn't.
 *
 * The onset term exists because materials do not all arrive at once. Six
 * drops each of pink pepper (evap_index 82) and agarwood (evap_index 15) are
 * the same dose at the same strength, but at the instant of spraying the
 * pepper is already fully in the air and the agarwood has barely begun to
 * evaporate — it climbs for hours and peaks somewhere in the drydown.
 *
 * Both the starting height `f0` and the time-to-peak `t_peak` are driven by
 * evap_index AND strength together. Volatility alone is not enough: see the
 * note on the onset constants below for why vanillin, which is as heavy as
 * agarwood, is nonetheless in the air from the first second.
 *
 * What this is NOT: a vapour-pressure simulation, a model of how materials
 * suppress or lift each other, or a substitute for smelling the thing on a
 * blotter at four hours. It answers "roughly what is in the air, and when" —
 * which is the question the graph is for.
 */

export type {
  AtelierFormulaRow as FormulaRow,
  AtelierMaterial,
  AtelierNotePosition as NotePosition,
} from "../atelier-contracts.js";
import type {
  AtelierFormulaRow as FormulaRow,
  AtelierMaterial,
} from "../atelier-contracts.js";

/** Shape exponents per evap_curve. Higher falls off faster. */
const CURVE_EXPONENT: Record<string, number> = {
  fast: 3.2,
  "steep-decay": 2.4,
  "steady-decay": 1.6,
  mid: 1.3,
  linear: 1.0,
  "long-tail": 0.7,
  plateau: 0.45,
};
const DEFAULT_EXPONENT = 1.3;

/**
 * Onset shape constants.
 *
 * Onset depends on TWO properties, not one. Volatility (`evap_index`) sets how
 * fast the material fills the air. Potency (`strength`) sets how little of
 * that air you need before you can smell it. A first version of this used
 * evap_index alone and got a whole class of materials wrong in the same
 * direction: vanillin, labdanum, coumarin, civet, geosmin and norlimbanol all
 * came out near-silent for the first hour, when in fact you smell every one of
 * them the moment it is on the blotter. They are heavy AND potent — the
 * headspace is barely building, and it does not need to, because the
 * detection threshold is far below it.
 *
 * The palette's own numbers separate the two groups cleanly once potency is
 * included. Materials described at the bench as immediately present run
 * strength 6–10; the ones that genuinely take an hour to arrive (Iso E Super,
 * Galaxolide, Exaltolide, ethylene brassylate, benzyl benzoate) run 1–4.
 *
 * Note that `strength` therefore does two different jobs in this model, which
 * is correct rather than double-counting: it scales how LOUD the curve gets
 * (in contributionAt) and it shapes how SOON the curve gets there (here).
 * Both follow from the same underlying property — the inverse of the odour
 * detection threshold — which is what `strength` is a hand-authored proxy for.
 * The palette has real `odt_ppb` for 7 of 73 materials and `vp_mmhg_25c` for
 * 2, which is not enough to model this from physics, so it is calibrated
 * against known bench behaviour and stated as such.
 *
 *   cis-3-hexenyl acetate  ei 95 str 9   starts at 95%, peaks in seconds
 *   pink pepper            ei 82 str 6   starts at 86%, peaks in 2 minutes
 *   guaiacol               ei 40 str 10  starts at 81%, peaks in 36 minutes
 *   vanillin               ei 13 str 7   starts at 29%, peaks at 2.1h
 *   labdanum               ei  9 str 7   starts at 23%, peaks at 2.4h
 *   Iso E Super            ei 18 str 4   starts at 18%, peaks at 2.3h
 *   benzyl benzoate        ei 10 str 1   starts at  4%, peaks at 3.6h
 */
const ONSET_MAX_PEAK_HOURS = 5;
const ONSET_PEAK_SHARPNESS = 2.6;
/** How much potency pulls the peak earlier. 0 would ignore strength entirely. */
const ONSET_POTENCY_SPEEDUP = 0.55;
const ONSET_FLOOR_EXPONENT = 1.5;
/** How much potency lifts the starting height. This is the correction. */
const ONSET_POTENCY_LIFT = 0.85;
const ONSET_FLOOR_MIN = 0.02;
const ONSET_FLOOR_MAX = 0.95;

export function decayExponent(evapCurve: string): number {
  return CURVE_EXPONENT[evapCurve] ?? DEFAULT_EXPONENT;
}

/** Fraction of a material still perceptible at `hours`, in [0, 1]. */
export function remainingAt(material: AtelierMaterial, hours: number): number {
  if (hours <= 0) return 1;
  const u = hours / Math.max(material.tenacityHours, 0.1);
  if (u >= 1) return 0;
  return Math.pow(1 - u, decayExponent(material.evapCurve));
}

/** 0.1 to 1.0. A stand-in for the inverse of the detection threshold. */
function potency(material: AtelierMaterial): number {
  return clamp(material.strength, 1, 10) / 10;
}

/**
 * How long this material takes to reach full presence. A top note is there
 * before you have put the blotter down; a quiet macrocyclic musk is still
 * building three hours later. Potency pulls the peak earlier, because a
 * material you can smell at a hundredth of its eventual headspace reaches its
 * perceptible plateau long before the headspace itself stops filling.
 */
export function onsetPeakHours(material: AtelierMaterial): number {
  const heaviness = (100 - clamp(material.evapIndex, 0, 100)) / 100;
  return (
    ONSET_MAX_PEAK_HOURS *
    Math.pow(heaviness, ONSET_PEAK_SHARPNESS) *
    (1 - ONSET_POTENCY_SPEEDUP * potency(material))
  );
}

/**
 * The share of a material's eventual presence that is already perceptible at
 * the instant of application — where its curve *starts*.
 *
 * Volatility gives the headspace; potency decides how much of that headspace
 * is above threshold. This is why vanillin and Galaxolide, which sit four
 * points apart on evap_index, start in completely different places: one is
 * strength 7 and one is strength 4.
 */
export function onsetFloor(material: AtelierMaterial): number {
  const exponent = ONSET_FLOOR_EXPONENT * (1 - ONSET_POTENCY_LIFT * potency(material));
  const raw = Math.pow(clamp(material.evapIndex, 0, 100) / 100, exponent);
  return clamp(raw, ONSET_FLOOR_MIN, ONSET_FLOOR_MAX);
}

/** Rise toward full presence, in [f0, 1]. */
export function onsetAt(material: AtelierMaterial, hours: number): number {
  const f0 = onsetFloor(material);
  if (hours <= 0) return f0;
  const peak = onsetPeakHours(material);
  // Below a couple of seconds the rise is instantaneous for any practical
  // purpose, and dividing by it would only produce noise.
  if (peak < 1e-4) return 1;
  return f0 + (1 - f0) * (1 - Math.exp((-3 * hours) / peak));
}

/**
 * Stevens' exponent for odour intensity. 0.5 — perceived loudness goes as the
 * square root of concentration.
 *
 * Note this applies to the DOSE only, not to `strength`. Strength is already
 * a perceptual rating (how loud one unit of this reads), so compressing it
 * again would be applying the same psychophysics twice.
 */
const DOSE_EXPONENT = 0.5;

/** Perceived contribution of one dosed material at `hours`. */
export function contributionAt(material: AtelierMaterial, neatPct: number, hours: number): number {
  if (neatPct <= 0) return 0;
  return (
    Math.pow(neatPct, DOSE_EXPONENT) *
    (material.strength / 10) *
    onsetAt(material, hours) *
    remainingAt(material, hours)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A non-linear time axis. Tenacity spans 2h to 300h, and a wearing is judged
 * in its first ten minutes as much as its twelfth hour, so a linear axis
 * would crush the opening into the y-axis. Square-root spacing keeps the
 * first hour legible without throwing away the drydown.
 */
export const MAX_HOURS = 24;
export const TIME_TICKS: { hours: number; label: string }[] = [
  { hours: 0, label: "0" },
  { hours: 0.25, label: "15m" },
  { hours: 1, label: "1h" },
  { hours: 3, label: "3h" },
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
];

export function timeToFraction(hours: number): number {
  return Math.sqrt(Math.min(hours, MAX_HOURS) / MAX_HOURS);
}

export interface MaterialSeries {
  material: AtelierMaterial;
  neatPct: number;
  /** contribution at each sample point */
  points: number[];
}

export interface VolatilityModel {
  /** Sample times in hours, non-linearly spaced to match the axis. */
  times: number[];
  series: MaterialSeries[];
  /** Summed contribution at each sample point. */
  total: number[];
  /** Largest value on any axis, for scaling. */
  peak: number;
}

export function buildVolatilityModel(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  samples = 90,
): VolatilityModel {
  // Sample evenly along the *drawn* axis, so the opening — where everything
  // is changing fastest — gets the most sample points.
  const times: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    times.push(f * f * MAX_HOURS);
  }

  const series: MaterialSeries[] = [];
  for (const row of rows) {
    const material = byId.get(row.materialId);
    if (!material) continue;
    series.push({
      material,
      neatPct: row.neatPct,
      points: times.map((t) => contributionAt(material, row.neatPct, t)),
    });
  }

  const total = times.map((_, i) => series.reduce((sum, s) => sum + s.points[i], 0));
  // Not total[0] — with the onset term the blend's loudest moment is usually
  // several minutes in, and for a base-heavy formula it can be hours in.
  const peak = Math.max(...total, 0.0001);
  return { times, series, total, peak };
}

/** The strongest few materials at a given moment — "what you smell at 1h". */
export function dominantAt(
  model: VolatilityModel,
  hours: number,
  count = 3,
): { material: AtelierMaterial; share: number }[] {
  const contributions = model.series.map((s) => ({
    material: s.material,
    value: contributionAt(s.material, s.neatPct, hours),
  }));
  const sum = contributions.reduce((a, c) => a + c.value, 0);
  if (sum <= 0) return [];
  return contributions
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .map((c) => ({ material: c.material, share: c.value / sum }));
}

export interface PyramidSplit {
  top: number;
  heart: number;
  base: number;
}

/** Share of the neat load sitting in each tier. */
export function pyramidSplit(rows: FormulaRow[], byId: Map<string, AtelierMaterial>): PyramidSplit {
  const acc: PyramidSplit = { top: 0, heart: 0, base: 0 };
  let total = 0;
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m) continue;
    acc[m.notePosition] += row.neatPct;
    total += row.neatPct;
  }
  if (total <= 0) return acc;
  return { top: (acc.top / total) * 100, heart: (acc.heart / total) * 100, base: (acc.base / total) * 100 };
}

export interface BenchWarning {
  materialId: string;
  materialName: string;
  severity: "warn" | "info";
  message: string;
}

/** How long the whole thing reads as present — where the total falls below 5% of peak. */
export function estimatedWearHours(model: VolatilityModel): number {
  const threshold = model.peak * 0.05;
  for (let i = model.total.length - 1; i >= 0; i--) {
    if (model.total[i] >= threshold) return model.times[i];
  }
  return 0;
}

/**
 * The same checks generate_accords.py applies at build time, run live as the
 * formula is edited: is a dose outside the material's usual range, is it
 * over its own ceiling, is it too small to weigh at this batch size, and is
 * it flagged for IFRA.
 */
export function benchWarnings(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  batchGrams: number,
  minWeighableG = 0.05,
): BenchWarning[] {
  const out: BenchWarning[] = [];
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m) continue;
    const doseToday = (row.neatPct / 100) * batchGrams / m.stockDilution;

    if (row.neatPct > m.maxNeat) {
      out.push({
        materialId: m.id,
        materialName: m.name,
        severity: "warn",
        message: `${row.neatPct}% is over this material's ${m.maxNeat}% ceiling.`,
      });
    } else if (row.neatPct > m.typicalRange[1]) {
      out.push({
        materialId: m.id,
        materialName: m.name,
        severity: "info",
        message: `Above the usual ${m.typicalRange[0]}–${m.typicalRange[1]}% range.`,
      });
    }

    if (m.minEffectivePct !== null && row.neatPct > 0 && row.neatPct < m.minEffectivePct) {
      out.push({
        materialId: m.id,
        materialName: m.name,
        severity: "info",
        message: `Below ${m.minEffectivePct}% this usually reads as nothing at all.`,
      });
    }

    if (doseToday > 0 && doseToday < minWeighableG) {
      out.push({
        materialId: m.id,
        materialName: m.name,
        severity: "warn",
        message: `${doseToday.toFixed(4)} g is under the ${minWeighableG} g minimum — use a working dilution or a bigger batch.`,
      });
    }
  }
  return out;
}
