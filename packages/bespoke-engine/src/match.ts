/**
 * SERVER-ONLY. This file imports data/accords.json (~600KB of pre-dosed
 * formulas for 200 accords) and must never be imported from a "use client"
 * component — only from web/app/bespoke/actions.ts ("use server"). The
 * client only ever holds a Fingerprint + Constraints (a handful of numbers
 * and short arrays); the matched 1-3 accords come back from the server
 * action already picked.
 */

import { cosineDistance, cosineSimilarity } from "./similarity.js";
import type { Accord, Constraints, Fingerprint, MatchInput, MatchResult, Modifiers, OutputChoice, PyramidRatio } from "./types.js";
import { DIMENSIONS } from "./types.js";
import { loadAccords } from "./load-data.js";

// Same trusted-cast situation as data.ts: note_position etc. infer as
// plain `string` from JSON, not the literal unions Accord expects.
const ACCORDS: Accord[] = loadAccords().accords;

const DIVERGENCE_THRESHOLD = 0.25;
const SEARCH_WINDOW = 8;
const MATERIAL_BONUS_WEIGHT = 0.015;
const PYRAMID_BONUS_WEIGHT = 0.03;
const MODIFIER_BONUS_WEIGHT = 0.02;

export interface RankedAccord {
  accord: Accord;
  score: number;
}

/** boost_families multiply, cap_families ceiling the fingerprint before scoring. */
function adjustFingerprint(fingerprint: Fingerprint, constraints: Constraints): Fingerprint {
  const next = { ...fingerprint };
  for (const dim of DIMENSIONS) {
    const cap = constraints.capFamilies[dim];
    if (cap !== undefined) next[dim] = Math.min(next[dim], cap);
    const boost = constraints.boostFamilies[dim];
    if (boost !== undefined) next[dim] = next[dim] * boost;
  }
  return next;
}

function pyramidWeights(accord: Accord): PyramidRatio {
  const totals = { top: 0, heart: 0, base: 0 };
  for (const line of accord.formula) totals[line.note_position] += line.neat_pct;
  const sum = totals.top + totals.heart + totals.base || 1;
  return { top: (totals.top / sum) * 100, heart: (totals.heart / sum) * 100, base: (totals.base / sum) * 100 };
}

/** 1 = perfect match to the target top/heart/base ratio, 0 = maximally off. */
function pyramidFit(target: PyramidRatio, actual: PyramidRatio): number {
  const dist = Math.abs(target.top - actual.top) + Math.abs(target.heart - actual.heart) + Math.abs(target.base - actual.base);
  return Math.max(0, 1 - dist / 100);
}

/**
 * Cosine-similarity ranking of every accord against the customer's
 * fingerprint, with small tiebreaker bonuses for constraint signals that
 * don't map cleanly onto the 10-dimension vector: boost_materials overlap,
 * how well the accord's own top/heart/base split fits the requested
 * pyramid_ratio, and how close the accord's patina/moisture sit to the
 * customer's accumulated modifiers (modifiers never enter the cosine
 * similarity itself — BESPOKE_ENGINE_SPEC.md §2.2 is explicit that they're
 * renderers, not dimensions).
 */
export function rankAccords(
  fingerprint: Fingerprint,
  modifiers: Modifiers,
  constraints: Constraints,
  accords: Accord[] = ACCORDS,
): RankedAccord[] {
  const adjusted = adjustFingerprint(fingerprint, constraints);
  const boostSet = new Set(constraints.boostMaterials);
  return accords
    .map((accord) => {
      let score = cosineSimilarity(adjusted, accord.vector);

      const overlap = accord.formula.filter((line) => boostSet.has(line.material_id)).length;
      score += overlap * MATERIAL_BONUS_WEIGHT;

      if (constraints.pyramidRatio) {
        score += pyramidFit(constraints.pyramidRatio, pyramidWeights(accord)) * PYRAMID_BONUS_WEIGHT;
      }

      const modifierDist =
        Math.abs(modifiers.patina - accord.modifiers.patina) + Math.abs(modifiers.moisture - accord.modifiers.moisture);
      score += Math.max(0, 1 - modifierDist / 12) * MODIFIER_BONUS_WEIGHT;

      return { accord, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Hard post-filter (§5 step 6): a veto REMOVES a candidate outright, never
 * merely lowers its score. cap_materials/cap_patina reject an accord that
 * leans on a capped material past the given ceiling; attar_safe is
 * enforced whenever the customer chose the attar output path at A6.
 */
export function applyConstraintFilters(
  ranked: RankedAccord[],
  constraints: Constraints,
  outputChoice: OutputChoice | null,
): RankedAccord[] {
  return ranked.filter(({ accord }) => {
    if (accord.formula.some((line) => constraints.vetoMaterials.includes(line.material_id))) return false;
    if (
      accord.formula.some((line) => {
        const cap = constraints.capMaterials[line.material_id];
        return cap !== undefined && line.neat_pct > cap;
      })
    ) {
      return false;
    }
    if (constraints.capPatina !== null && accord.modifiers.patina > constraints.capPatina) return false;
    if (outputChoice?.attar_path && !accord.attar_safe) return false;
    return true;
  });
}

/**
 * Generalized divergence gate (§5.1, generalized for §5.2 stage 3's n=3):
 * rank 1 is always the top score. Each subsequent pick is the first
 * candidate, scanning up to SEARCH_WINDOW ranks ahead, whose cosine
 * distance from EVERY already-picked candidate clears the threshold. If
 * none clears it in the window, fall back to the best-scoring candidate
 * from a family_cluster not already represented (every accord
 * self-declares family_cluster — no clusters.json lookup needed).
 */
export function divergenceGate(ranked: RankedAccord[], n: number): Accord[] {
  if (ranked.length === 0) return [];
  const picked: Accord[] = [ranked[0].accord];

  while (picked.length < n) {
    const startIndex = ranked.findIndex(({ accord }) => accord === picked[picked.length - 1]) + 1;
    const window = ranked.slice(startIndex, startIndex + SEARCH_WINDOW);
    const divergent = window.find(
      ({ accord }) =>
        !picked.includes(accord) && picked.every((chosen) => cosineDistance(chosen.vector, accord.vector) > DIVERGENCE_THRESHOLD),
    );
    if (divergent) {
      picked.push(divergent.accord);
      continue;
    }

    const representedClusters = new Set(picked.map((accord) => accord.family_cluster.primary));
    const clusterFallback = ranked.find(
      ({ accord }) => !picked.includes(accord) && !representedClusters.has(accord.family_cluster.primary),
    );
    if (clusterFallback) {
      picked.push(clusterFallback.accord);
      continue;
    }

    const nextBest = ranked.find(({ accord }) => !picked.includes(accord));
    if (!nextBest) break;
    picked.push(nextBest.accord);
  }

  return picked;
}

/**
 * EXPERT-TOP3-PREVIEW's on_select: once the customer picks their bottle
 * from the 3 candidates, the sample is simply the more cosine-distant of
 * the two leftovers — no threshold, no cluster fallback. Deliberately not
 * routed through divergenceGate, which solves a different problem.
 */
export function pickMoreDistant(chosen: Accord, remaining: [Accord, Accord]): Accord {
  const [a, b] = remaining;
  return cosineDistance(chosen.vector, a.vector) >= cosineDistance(chosen.vector, b.vector) ? a : b;
}

function candidatePool(state: MatchInput, minSize: number): RankedAccord[] {
  const ranked = rankAccords(state.fingerprint, state.modifiers, state.constraints);
  const filtered = applyConstraintFilters(ranked, state.constraints, state.outputChoice);
  // Constraints are meant to be absolute, but with 200 accords a very
  // narrow combination could leave too few survivors for a genuine
  // divergent sample. Falling back to the unfiltered ranking for the
  // shortfall is safer than shipping a broken result.
  return filtered.length >= minSize ? filtered : ranked;
}

/** The standard §5/§5.1 path: one bottle, one divergent sample. */
export function matchFingerprint(state: MatchInput): MatchResult {
  const pool = candidatePool(state, 2);
  const [bottle, sample] = divergenceGate(pool, 2);
  return { bottle, sample: sample ?? bottle };
}

/** §5.2 stage 3: re-score and divergence-gate to 3 for EXPERT-TOP3-PREVIEW. */
export function matchExpertShortlist(state: MatchInput): Accord[] {
  const pool = candidatePool(state, 3);
  return divergenceGate(pool, Math.min(3, pool.length));
}

/** After the customer picks their bottle from the 3-candidate preview. */
export function matchExpertFinal(chosenAccordId: string, shortlist: Accord[]): MatchResult {
  const chosen = shortlist.find((accord) => accord.id === chosenAccordId) ?? shortlist[0];
  const remaining = shortlist.filter((accord) => accord.id !== chosen.id);
  const sample =
    remaining.length === 2 ? pickMoreDistant(chosen, [remaining[0], remaining[1]]) : (remaining[0] ?? chosen);
  return { bottle: chosen, sample };
}
