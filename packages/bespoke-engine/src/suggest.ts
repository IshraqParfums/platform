/**
 * What to reach for next.
 *
 * The Melding panel already suggests materials, but only to repair something
 * broken — it waits until the formula has an orphan or has split in two. That
 * is a fault-finder, not a collaborator. This is the other thing: from the
 * very first material, a live-ranked list of what would go in next, which
 * changes every time the formula does.
 *
 * TWO STAGES, IN THIS ORDER, AND THE ORDER IS THE WHOLE IDEA
 * ---------------------------------------------------------
 * 1. What is this perfume MISSING? Not "which material scores highest" but
 *    "what is structurally absent" — no top note, nothing in the air between
 *    twenty minutes and two hours, nothing that will still be there tomorrow,
 *    no diffusion. A composition with no base does not need a better top, and
 *    a recommender that only ranks by affinity will happily hand you one.
 *
 * 2. Which materials close those gaps, given what is already in the bottle?
 *    Ranked on need first, fit second.
 *
 * WHY NOVELTY IS SCORED, NOT JUST FIT
 * -----------------------------------
 * A recommender that maximises affinity converges on suggesting a second
 * cedarwood next to your cedarwood: it is maximally compatible and adds
 * nothing. So a candidate that would read as a duplicate of something already
 * present is penalised, hard, and told to the perfumer as the reason. The
 * useful suggestion is the one that is *connected enough to belong and
 * different enough to be worth adding*, which is a balance rather than a
 * maximum.
 *
 * Everything here is derived from data the palette already carries. Nothing
 * is a preference model, nothing is learned, and there is no hidden ranking:
 * every suggestion arrives with the reasons that produced it, so a perfumer
 * can disagree with the tool on the evidence rather than on faith.
 */

import {
  affinity,
  FUSED_THRESHOLD,
  type Constituent,
  type FacetLexicon,
} from "./affinity.js";
import type { Dimension } from "./types.js";
import {
  contributionAt,
  type AtelierMaterial,
  type FormulaRow,
  type VolatilityModel,
} from "./volatility.js";

/* ------------------------------------------------------------------ gaps */

export type GapKind = "tier" | "timeline" | "fixative" | "diffusion" | "crowding";

export interface Gap {
  kind: GapKind;
  /** Short label for the map. */
  label: string;
  /** What is actually wrong, in a sentence. */
  detail: string;
  /** 0–1. How much this matters relative to the other gaps. */
  severity: number;
}

/**
 * The windows a wearing is actually judged in. Not evenly spaced, because
 * attention is not: the first ten minutes decide whether someone likes it and
 * the twelfth hour decides whether they buy it again.
 */
const WINDOWS: { key: string; label: string; from: number; to: number; weight: number }[] = [
  { key: "opening", label: "the first ten minutes", from: 0, to: 0.17, weight: 1 },
  { key: "lift", label: "ten minutes to an hour", from: 0.17, to: 1, weight: 0.9 },
  { key: "heart", label: "one to four hours", from: 1, to: 4, weight: 1 },
  { key: "drydown", label: "four to twelve hours", from: 4, to: 12, weight: 0.9 },
  { key: "trail", label: "past twelve hours", from: 12, to: 24, weight: 0.7 },
];

/** Slack on the tier floors, in percentage points. See findGaps. */
const TIER_TOLERANCE = 0.5;

/** Share of the neat load a healthy pyramid puts in each tier, roughly. */
const TIER_TARGET: Record<"top" | "heart" | "base", [number, number]> = {
  top: [10, 35],
  heart: [20, 50],
  base: [25, 60],
};

/** A material this tenacious is what keeps a perfume on skin overnight. */
const FIXATIVE_HOURS = 100;
/**
 * Materials that can carry a large dose without shouting — the diffusion
 * chassis. Low strength plus a high ceiling is exactly the profile.
 */
function isDiffuser(m: AtelierMaterial): boolean {
  return m.strength <= 4 && m.typicalRange[1] >= 10;
}

function meanTotalBetween(model: VolatilityModel, from: number, to: number): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < model.times.length; i++) {
    const t = model.times[i];
    if (t < from || t > to) continue;
    sum += model.total[i];
    n += 1;
  }
  return n > 0 ? sum / n : 0;
}

/**
 * The map: what this composition is missing, right now.
 *
 * Returned even for a one-material formula — that is the point. With a single
 * top note in the bottle the honest answer is "almost everything", and saying
 * so is more useful than staying quiet until there is enough to analyse.
 */
export function findGaps(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  model: VolatilityModel,
): Gap[] {
  if (rows.length === 0) return [];
  const materials = rows
    .map((r) => byId.get(r.materialId))
    .filter((m): m is AtelierMaterial => Boolean(m));
  if (materials.length === 0) return [];

  const gaps: Gap[] = [];
  const total = rows.reduce((s, r) => s + r.neatPct, 0);

  // ---- tiers -------------------------------------------------------------
  const tierLoad: Record<"top" | "heart" | "base", number> = { top: 0, heart: 0, base: 0 };
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (m) tierLoad[m.notePosition] += row.neatPct;
  }
  for (const tier of ["top", "heart", "base"] as const) {
    const share = total > 0 ? (tierLoad[tier] / total) * 100 : 0;
    const [lo] = TIER_TARGET[tier];
    // Half a point of tolerance. Without it a tier landing exactly on the
    // floor still reports as thin — and applying the remedy for that gap
    // re-raises the same gap, because 9.9995 is less than 10.
    if (share < lo - TIER_TOLERANCE) {
      gaps.push({
        kind: "tier",
        label: share === 0 ? `No ${tier} note` : `Thin ${tier}`,
        detail:
          share === 0
            ? `Nothing in this formula is a ${tier} note.`
            : `The ${tier} is ${share.toFixed(0)}% of the load; ${lo}% is about the floor.`,
        severity: share === 0 ? 1 : Math.min(1, (lo - share) / lo),
      });
    }
  }

  // ---- holes in the wearing ---------------------------------------------
  if (model.peak > 0) {
    for (const w of WINDOWS) {
      const mean = meanTotalBetween(model, w.from, w.to);
      const relative = mean / model.peak;
      if (relative < 0.22) {
        gaps.push({
          kind: "timeline",
          label: `Quiet at ${w.label}`,
          detail:
            relative < 0.03
              ? `There is effectively nothing in the air ${w.label}.`
              : `Only ${Math.round(relative * 100)}% of peak is left ${w.label}.`,
          severity: Math.min(1, (0.22 - relative) / 0.22) * w.weight,
        });
      }
    }
  }

  // ---- will it still be there tomorrow? ---------------------------------
  if (!materials.some((m) => m.tenacityHours >= FIXATIVE_HOURS)) {
    gaps.push({
      kind: "fixative",
      label: "No fixative",
      detail: `Nothing here lasts past ${FIXATIVE_HOURS} hours, so there is nothing holding the rest down.`,
      severity: 0.75,
    });
  }

  // ---- will anyone else smell it? ---------------------------------------
  if (!materials.some(isDiffuser)) {
    gaps.push({
      kind: "diffusion",
      label: "No diffusion",
      detail:
        "Nothing here can carry volume without adding a smell of its own. This will sit on the skin rather than travel.",
      severity: 0.6,
    });
  }

  // ---- too much of one thing --------------------------------------------
  const familyLoad = new Map<Dimension, number>();
  for (const row of rows) {
    const m = byId.get(row.materialId);
    if (!m?.primaryFamily) continue;
    familyLoad.set(m.primaryFamily, (familyLoad.get(m.primaryFamily) ?? 0) + row.neatPct);
  }
  for (const [family, load] of familyLoad) {
    const share = total > 0 ? load / total : 0;
    if (share > 0.7 && materials.length >= 3) {
      gaps.push({
        kind: "crowding",
        label: `All ${family}`,
        detail: `${Math.round(share * 100)}% of the load is ${family}. Something to push against it would give it a shape.`,
        severity: Math.min(1, (share - 0.7) / 0.3) * 0.7,
      });
    }
  }

  return gaps.sort((a, b) => b.severity - a.severity);
}

/* ----------------------------------------------------------- suggestions */

export interface SuggestionReason {
  kind: "fills" | "shares" | "meets" | "paired" | "note";
  text: string;
  /** Contribution to the score, for ordering the reasons themselves. */
  weight: number;
}

export interface Suggestion {
  material: AtelierMaterial;
  score: number;
  reasons: SuggestionReason[];
  /** Gap labels this candidate would close. */
  fills: string[];
  /** Set when it would read as the same material as something already in. */
  redundantWith: AtelierMaterial | null;
  /** Where to open it, mid of its own typical range. */
  suggestedPct: number;
}

const SCORE_WEIGHTS = {
  need: 0.45,
  fit: 0.3,
  novelty: 0.15,
  endorsed: 0.1,
};

/** The most a single dose remedy will cut a material in one step. */
const MAX_SINGLE_CUT = 0.5;

/** How much of a window a candidate has to cover to count as filling it. */
const FILLS_WINDOW_THRESHOLD = 0.25;

function midDose(m: AtelierMaterial): number {
  const [lo, hi] = m.typicalRange;
  return Math.round(((lo + hi) / 2) * 1000) / 1000;
}

/**
 * Would this candidate, at a typical dose, put something into the air during
 * a window that is currently quiet?
 */
function coversWindow(m: AtelierMaterial, from: number, to: number, peak: number): boolean {
  if (peak <= 0) return true;
  const dose = midDose(m);
  const samples = 5;
  let sum = 0;
  for (let i = 0; i <= samples; i++) {
    sum += contributionAt(m, dose, from + ((to - from) * i) / samples);
  }
  return sum / (samples + 1) >= peak * FILLS_WINDOW_THRESHOLD;
}

/**
 * Rank the palette by what should go in next.
 *
 * `noteSuggestions` maps a material to the bench note currently asking for it
 * — folded in as an endorsement rather than a separate list, so the perfumer
 * has one place to look instead of three. It carries the note's title rather
 * than a bare flag so the row can say WHICH note wants it; five rows all
 * reading "a bench note is asking for it" is not a reason, it is noise.
 */
export function suggestNext(
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  palette: AtelierMaterial[],
  model: VolatilityModel,
  gaps: Gap[],
  lexicon: FacetLexicon,
  constituentsById: Map<string, Constituent>,
  pairsWith: Map<string, Set<string>>,
  noteSuggestions: Map<string, string>,
  limit = 8,
): Suggestion[] {
  const inFormula = new Set(rows.map((r) => r.materialId));
  const present = rows
    .map((r) => byId.get(r.materialId))
    .filter((m): m is AtelierMaterial => Boolean(m));

  // Normalise against everything that is missing, not against the single
  // worst gap — otherwise a candidate closing four gaps scores above 1 and
  // the numbers stop meaning anything.
  const totalSeverity = Math.max(
    gaps.reduce((sum, g) => sum + g.severity, 0),
    1,
  );
  const tierGaps = gaps.filter((g) => g.kind === "tier");
  const timelineGaps = gaps.filter((g) => g.kind === "timeline");
  const wantsFixative = gaps.some((g) => g.kind === "fixative");
  const wantsDiffusion = gaps.some((g) => g.kind === "diffusion");
  const crowded = gaps.filter((g) => g.kind === "crowding");
  const crowdedFamilies = new Set(
    crowded.map((g) => g.label.replace(/^All /, "") as Dimension),
  );

  const out: Suggestion[] = [];

  for (const candidate of palette) {
    if (inFormula.has(candidate.id)) continue;

    const reasons: SuggestionReason[] = [];
    const fills: string[] = [];
    let need = 0;

    // ---- does it close a structural gap? --------------------------------
    for (const gap of tierGaps) {
      const tier = gap.label.toLowerCase().includes("top")
        ? "top"
        : gap.label.toLowerCase().includes("heart")
          ? "heart"
          : "base";
      if (candidate.notePosition === tier) {
        need += gap.severity;
        fills.push(gap.label);
        reasons.push({
          kind: "fills",
          text: `a ${tier} note, which this formula does not have`,
          weight: gap.severity,
        });
      }
    }
    for (const gap of timelineGaps) {
      const w = WINDOWS.find((x) => gap.label.endsWith(x.label));
      if (w && coversWindow(candidate, w.from, w.to, model.peak)) {
        need += gap.severity;
        fills.push(gap.label);
        reasons.push({
          kind: "fills",
          text: `in the air ${w.label}, where there is currently a hole`,
          weight: gap.severity,
        });
      }
    }
    if (wantsFixative && candidate.tenacityHours >= FIXATIVE_HOURS) {
      const gap = gaps.find((g) => g.kind === "fixative")!;
      need += gap.severity;
      fills.push(gap.label);
      reasons.push({
        kind: "fills",
        text: `lasts ${candidate.tenacityHours}h — it would hold the rest down`,
        weight: gap.severity,
      });
    }
    if (wantsDiffusion && isDiffuser(candidate)) {
      const gap = gaps.find((g) => g.kind === "diffusion")!;
      need += gap.severity;
      fills.push(gap.label);
      reasons.push({
        kind: "fills",
        text: "carries volume without adding a smell of its own",
        weight: gap.severity,
      });
    }
    if (crowdedFamilies.size > 0 && candidate.primaryFamily && !crowdedFamilies.has(candidate.primaryFamily)) {
      const gap = crowded[0];
      need += gap.severity * 0.6;
      reasons.push({
        kind: "fills",
        text: `${candidate.primaryFamily} against a formula that is nearly all ${[...crowdedFamilies][0]}`,
        weight: gap.severity * 0.6,
      });
    }

    // ---- does it belong with what is already here? ----------------------
    const links = present.map((m) =>
      affinity(candidate, m, lexicon, constituentsById, pairsWith),
    );
    links.sort((a, b) => b.score - a.score);
    const best = links[0];
    // Mean of the top three, so a candidate has to belong to the composition
    // rather than to one material in it.
    const fit =
      links.length === 0
        ? 0.5
        : links.slice(0, 3).reduce((s, l) => s + l.score, 0) / Math.min(links.length, 3);

    if (best && best.score > 0.15) {
      const other = present.find((m) => m.id === (best.a === candidate.id ? best.b : best.a));
      if (other) {
        if (best.constituents.length > 0) {
          reasons.push({
            kind: "shares",
            text: `shares ${best.constituents[0].name.toLowerCase()} with ${other.name.split(" (")[0]}`,
            weight: best.score,
          });
        } else if (best.facets.length > 0) {
          reasons.push({
            kind: "meets",
            text: `meets ${other.name.split(" (")[0]} on ${best.facets[0].facet.replace(/-/g, " ")}`,
            weight: best.score,
          });
        }
      }
    }

    // ---- would it just be a second copy of something? -------------------
    const duplicate = links.find((l) => l.score >= FUSED_THRESHOLD);
    const redundantWith = duplicate
      ? (present.find(
          (m) => m.id === (duplicate.a === candidate.id ? duplicate.b : duplicate.a),
        ) ?? null)
      : null;
    const novelty = best ? 1 - Math.min(best.score, 1) : 1;

    // ---- endorsements ---------------------------------------------------
    let endorsed = 0;
    const pairedWith = present.filter(
      (m) => pairsWith.get(m.id)?.has(candidate.id) || pairsWith.get(candidate.id)?.has(m.id),
    );
    if (pairedWith.length > 0) {
      endorsed += Math.min(pairedWith.length / 2, 1) * 0.6;
      reasons.push({
        kind: "paired",
        text: `the palette pairs it with ${pairedWith
          .slice(0, 2)
          .map((m) => m.name.split(" (")[0])
          .join(" and ")}`,
        weight: 0.4,
      });
    }
    const askingNote = noteSuggestions.get(candidate.id);
    if (askingNote) {
      endorsed += 0.4;
      reasons.push({
        kind: "note",
        text: `the bench note “${askingNote}” asks for it`,
        weight: 0.5,
      });
    }

    const score =
      Math.min(need / totalSeverity, 1) * SCORE_WEIGHTS.need +
      fit * SCORE_WEIGHTS.fit +
      novelty * SCORE_WEIGHTS.novelty +
      Math.min(endorsed, 1) * SCORE_WEIGHTS.endorsed;

    // A near-duplicate is not a suggestion. Kept in the list only when it is
    // closing a real gap, and labelled, because sometimes a second sandalwood
    // genuinely is what a formula needs and the perfumer should decide that
    // rather than have the tool decide it silently.
    const penalised = redundantWith ? score * 0.35 : score;

    if (penalised <= 0.02) continue;
    out.push({
      material: candidate,
      score: penalised,
      reasons: reasons.sort((a, b) => b.weight - a.weight).slice(0, 3),
      fills,
      redundantWith,
      suggestedPct: midDose(candidate),
    });
  }

  return diversify(out.sort((a, b) => b.score - a.score), limit);
}

/**
 * Stop the list being four interchangeable musks.
 *
 * The highest-scoring candidates for "this needs a base note" are, correctly,
 * every base note in the palette — and a list of five near-identical answers
 * to the same question is no more useful than one. So after ranking, walk the
 * list and demote anything that is the third suggestion of the same tier and
 * family: it stays available further down, but the top of the list spends its
 * places on different ideas rather than on synonyms.
 */
function diversify(sorted: Suggestion[], limit: number): Suggestion[] {
  const taken: Suggestion[] = [];
  const deferred: Suggestion[] = [];
  const seen = new Map<string, number>();

  for (const s of sorted) {
    const key = `${s.material.notePosition}|${s.material.primaryFamily ?? "none"}`;
    const count = seen.get(key) ?? 0;
    if (count >= 2) {
      deferred.push(s);
      continue;
    }
    seen.set(key, count + 1);
    taken.push(s);
    if (taken.length >= limit) break;
  }
  return [...taken, ...deferred].slice(0, limit);
}

/**
 * The opening move, when the bench is empty.
 *
 * Ranking a candidate against nothing is meaningless, so this is a different
 * question: which materials are worth building *on*. Answered from the
 * palette's own numbers — heavily connected, broadly compatible, and useful
 * at a real dose rather than as a trace.
 */
export function suggestOpeners(palette: AtelierMaterial[], limit = 6): Suggestion[] {
  const scored = palette
    .map((m) => ({
      material: m,
      // A material that pairs with many others and can be dosed generously is
      // a foundation; a 0.05% captive is a finishing touch.
      score: Math.min(m.pairsWith.length / 6, 1) * 0.6 + Math.min(m.typicalRange[1] / 30, 1) * 0.4,
      reasons: [
        {
          kind: "paired" as const,
          text:
            m.bridgeEffect ||
            `pairs with ${m.pairsWith.length} other materials in the palette`,
          weight: 1,
        },
      ],
      fills: [],
      redundantWith: null,
      suggestedPct: midDose(m),
    }))
    .sort((a, b) => b.score - a.score);

  // Spread the opening moves across the pyramid. A list of six diffusion
  // chassis materials is a true answer to "what is most broadly useful" and a
  // useless answer to "where do I start" — you cannot smell a chassis.
  const out: Suggestion[] = [];
  for (const tier of ["top", "heart", "base"] as const) {
    out.push(...scored.filter((s) => s.material.notePosition === tier).slice(0, Math.ceil(limit / 3)));
  }
  return out.slice(0, limit);
}

/* ------------------------------------------------------- dose remedies */

export interface DoseRemedy {
  /** The gap this closes, matching Gap.label. */
  gapLabel: string;
  materialId: string;
  materialName: string;
  from: number;
  to: number;
  /** What this change does, in a sentence. */
  detail: string;
  /** True when the material's own ceiling stops it closing the gap fully. */
  short: boolean;
}

/**
 * Fix it by changing a number, not by adding a material.
 *
 * The first version of this engine could only ever say "add something", which
 * is the wrong answer surprisingly often. "Thin top — 8% of the load" usually
 * means raise the bergamot you already have, not buy a ninth material; a tool
 * that only adds will walk you to a fifteen-material formula when a six-
 * material one needed one number changed. Dose is where most real decisions
 * live, so it gets its own kind of answer.
 *
 * Not every gap has a dose remedy, and that is stated rather than faked. You
 * cannot re-dose your way to a base note you do not own, and raising a
 * material that has already faded will not fill a hole at eight hours.
 */
export function doseRemedies(
  gaps: Gap[],
  rows: FormulaRow[],
  byId: Map<string, AtelierMaterial>,
  model: VolatilityModel,
): DoseRemedy[] {
  const out: DoseRemedy[] = [];
  const total = rows.reduce((s, r) => s + r.neatPct, 0);
  if (total <= 0) return out;

  const withMaterial = rows.flatMap((r) => {
    const m = byId.get(r.materialId);
    return m ? [{ row: r, material: m }] : [];
  });

  for (const gap of gaps) {
    // ---- a tier that exists but is too small ---------------------------
    if (gap.kind === "tier" && gap.label.startsWith("Thin")) {
      const tier = gap.label.split(" ")[1] as "top" | "heart" | "base";
      const inTier = withMaterial.filter((x) => x.material.notePosition === tier);
      if (inTier.length === 0) continue;
      const tierLoad = inTier.reduce((s, x) => s + x.row.neatPct, 0);
      const rest = total - tierLoad;
      const [lo] = TIER_TARGET[tier];
      // Solve t' / (t' + rest) = lo/100 for the tier load that clears the floor.
      // Aim a touch above the floor rather than exactly at it, so the change
      // lands clear of the boundary instead of on it.
      const aim = lo + TIER_TOLERANCE;
      const wanted = (aim * rest) / (100 - aim);
      const deficit = wanted - tierLoad;
      if (deficit <= 0.001) continue;
      // Put it on the biggest thing in that tier — raising the material that
      // is already carrying the tier changes the balance least.
      const target = inTier.reduce((a, b) => (b.row.neatPct > a.row.neatPct ? b : a));
      const raw = target.row.neatPct + deficit;
      const capped = Math.min(raw, target.material.maxNeat);
      if (capped <= target.row.neatPct + 0.001) continue;
      out.push({
        gapLabel: gap.label,
        materialId: target.material.id,
        materialName: target.material.name,
        from: target.row.neatPct,
        to: round3(capped),
        detail:
          capped < raw
            ? `Takes the ${tier} to about ${Math.round(((tierLoad + capped - target.row.neatPct) / (rest + tierLoad + capped - target.row.neatPct)) * 100)}% — its ${target.material.maxNeat}% ceiling stops it going further.`
            : `Takes the ${tier} from ${Math.round((tierLoad / total) * 100)}% of the load to ${lo}%.`,
        short: capped < raw,
      });
    }

    // ---- one family swallowing the formula ------------------------------
    if (gap.kind === "crowding") {
      const family = gap.label.replace(/^All /, "");
      const inFamily = withMaterial.filter((x) => x.material.primaryFamily === family);
      if (inFamily.length === 0) continue;
      const familyLoad = inFamily.reduce((s, x) => s + x.row.neatPct, 0);
      const rest = total - familyLoad;
      // Bring it back to 60% of the load: f' / (f' + rest) = 0.6.
      const wanted = 1.5 * rest;
      const cut = familyLoad - wanted;
      if (cut <= 0.001) continue;
      const target = inFamily.reduce((a, b) => (b.row.neatPct > a.row.neatPct ? b : a));
      const floor = target.material.minEffectivePct ?? 0.01;
      // Never cut a material by more than half in one step. When one family
      // is 80% of the load the arithmetic says "reduce the patchouli from 14%
      // to nothing", which is correct and useless — the real answer there is
      // contrast, not subtraction, and the material suggestions below already
      // give that.
      const maxCut = target.row.neatPct * MAX_SINGLE_CUT;
      const applied = Math.min(cut, maxCut);
      const lowered = Math.max(floor, target.row.neatPct - applied);
      if (lowered >= target.row.neatPct - 0.001) continue;
      const reached = Math.round(((familyLoad - (target.row.neatPct - lowered)) /
        (total - (target.row.neatPct - lowered))) * 100);
      const partial = applied < cut - 0.001 || lowered > target.row.neatPct - applied;
      out.push({
        gapLabel: gap.label,
        materialId: target.material.id,
        materialName: target.material.name,
        from: target.row.neatPct,
        to: round3(lowered),
        detail: partial
          ? `Takes ${family} from ${Math.round((familyLoad / total) * 100)}% of the load to ${reached}%. Getting the rest of the way needs contrast added, not more subtraction.`
          : `Brings ${family} down from ${Math.round((familyLoad / total) * 100)}% of the load to about 60%.`,
        short: partial,
      });
    }

    // ---- a hole in the wearing -----------------------------------------
    if (gap.kind === "timeline" && model.peak > 0) {
      const w = WINDOWS.find((x) => gap.label.endsWith(x.label));
      if (!w) continue;
      // Which material is already doing the most in that window?
      const ranked = withMaterial
        .map((x) => ({
          ...x,
          here: meanContribution(x.material, x.row.neatPct, w.from, w.to),
        }))
        .filter((x) => x.here > 0)
        .sort((a, b) => b.here - a.here);
      if (ranked.length === 0) continue;
      const target = ranked[0];
      const current = meanTotalBetween(model, w.from, w.to);
      const wantedTotal = model.peak * 0.25;
      const shortfall = wantedTotal - current;
      if (shortfall <= 0) continue;
      // Perceived loudness goes as the square root of dose, so closing a
      // shortfall of k× costs k² in material. That gets expensive fast, and
      // past about three times the dose the honest answer is "add something",
      // not "pour more of this in".
      const factor = (target.here + shortfall) / target.here;
      const doseMultiplier = factor * factor;
      if (doseMultiplier > 3) continue;
      const raw = target.row.neatPct * doseMultiplier;
      const capped = Math.min(raw, target.material.maxNeat);
      if (capped <= target.row.neatPct + 0.001) continue;
      out.push({
        gapLabel: gap.label,
        materialId: target.material.id,
        materialName: target.material.name,
        from: target.row.neatPct,
        to: round3(capped),
        detail:
          capped < raw
            ? `More of what is already covering ${w.label}, as far as its ${target.material.maxNeat}% ceiling allows.`
            : `${target.material.name.split(" (")[0]} is already the main thing ${w.label}; this is ${doseMultiplier.toFixed(1)}× as much of it.`,
        short: capped < raw,
      });
    }
  }

  return out;
}

function meanContribution(m: AtelierMaterial, dose: number, from: number, to: number): number {
  const samples = 6;
  let sum = 0;
  for (let i = 0; i <= samples; i++) {
    sum += contributionAt(m, dose, from + ((to - from) * i) / samples);
  }
  return sum / (samples + 1);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
