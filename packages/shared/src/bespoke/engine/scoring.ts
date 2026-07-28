import { ACCORD_LIBRARY } from '../data/accord-library.js';
import { AXIS_DESC, AXIS_TO_CATEGORY, NAME_WORDS, WHY } from '../data/copy.js';
import { AXES, MATERIAL_POOL } from '../data/materials.js';
import {
  AXIS_FOLLOWUPS,
  CORE_QUESTIONS,
  PRECISION_QUESTIONS,
} from '../data/questions.js';
import type {
  BespokeAnswerEntry,
  BespokeAxis,
  BespokeMaterial,
  BespokeResult,
  Phase2Question,
} from '../types.js';

export const BESPOKE_ENGINE_VERSION = '1';

/** Max achievable weight per axis across Phase 1 only (mirrors HTML AXIS_MAX). */
export function getAxisMax(): Record<BespokeAxis, number> {
  const max = {} as Record<BespokeAxis, number>;
  AXES.forEach((a) => {
    max[a] = 0;
  });

  CORE_QUESTIONS.forEach((q) => {
    if (q.meta) return;
    const perAxisBest: Partial<Record<BespokeAxis, number>> = {};
    q.options.forEach((opt) => {
      Object.entries(opt.w || {}).forEach(([axis, val]) => {
        const a = axis as BespokeAxis;
        perAxisBest[a] = Math.max(perAxisBest[a] || 0, val as number);
      });
    });
    Object.entries(perAxisBest).forEach(([axis, val]) => {
      max[axis as BespokeAxis] += val as number;
    });
  });

  return max;
}

export interface Phase2BuildResult {
  questions: Phase2Question[];
  interimRanked: BespokeAxis[];
}

/**
 * Build the 5 adaptive Phase 2 questions from Phase 1 answers.
 * Exact port of HTML `buildPhase2Questions` (including Math.random tiebreak).
 */
export function buildPhase2Questions(
  phase1Answers: Array<BespokeAnswerEntry | null | undefined>,
): Phase2BuildResult {
  const axisMax = getAxisMax();
  const scores = {} as Record<BespokeAxis, number>;
  AXES.forEach((a) => {
    scores[a] = 0;
  });

  phase1Answers.slice(0, CORE_QUESTIONS.length).forEach((a) => {
    if (!a || a.meta || !a.w) return;
    Object.entries(a.w).forEach(([axis, val]) => {
      const ax = axis as BespokeAxis;
      scores[ax] = (scores[ax] || 0) + (val as number);
    });
  });

  const norm = {} as Record<BespokeAxis, number>;
  AXES.forEach((a) => {
    norm[a] = axisMax[a] ? scores[a] / axisMax[a] : 0;
  });

  const shuffled = AXES.slice().sort(() => Math.random() - 0.5);
  const ranked = shuffled.sort((a, b) => norm[b] - norm[a]);
  const top3 = ranked.slice(0, 3);

  const dynQs: Phase2Question[] = top3.map((axis) => ({
    text: AXIS_FOLLOWUPS[axis].text,
    options: AXIS_FOLLOWUPS[axis].options,
    dynType: 'followup' as const,
    forAxis: axis,
  }));

  dynQs.push({
    text: PRECISION_QUESTIONS[0].text,
    options: PRECISION_QUESTIONS[0].options,
    dynType: 'exclude',
  });
  dynQs.push({
    text: PRECISION_QUESTIONS[1].text,
    options: PRECISION_QUESTIONS[1].options,
    dynType: 'uniqueness',
  });

  return { questions: dynQs, interimRanked: ranked };
}

/**
 * Exact port of HTML `computeAndShowResult` (without DOM).
 * Pass the same `interimRanked` returned from `buildPhase2Questions`.
 */
export function computeResult(
  answers: Array<BespokeAnswerEntry | null | undefined>,
  interimRanked?: BespokeAxis[],
): BespokeResult {
  let intensity = 'medium';
  let longevity = 'medium';
  let uniqueness = 'balanced';
  let excludedAxis: BespokeAxis | null = null;
  let forceLight = false;
  const preferredMaterial: Partial<Record<BespokeAxis, string>> = {};

  answers.forEach((a) => {
    if (!a) return;
    if (a.meta === 'intensity') intensity = a.value || intensity;
    else if (a.meta === 'longevity') longevity = a.value || longevity;
    else if (a.dynType === 'followup' && a.forAxis && a.material) {
      preferredMaterial[a.forAxis] = a.material;
    } else if (a.dynType === 'exclude') {
      excludedAxis = (a.exclude as BespokeAxis | null) ?? null;
      forceLight = !!a.forceLight;
    } else if (a.dynType === 'uniqueness') {
      uniqueness = a.value || uniqueness;
    }
  });

  if (forceLight) intensity = 'light';

  let ranked = (interimRanked || AXES.slice()).filter(
    (a) => a !== excludedAxis,
  );
  const top1 = ranked[0];
  const top2 = ranked[1];
  const top3 = ranked[2];
  const top4 = ranked[3];

  const priorityAxes = [top1, top2, top3].filter(Boolean) as BespokeAxis[];

  function placePreferredFirst(
    role: 'top' | 'heart' | 'base',
    count: number,
    exclude: string[],
    picks: BespokeMaterial[],
  ): BespokeMaterial[] {
    for (const axis of priorityAxes) {
      if (picks.length >= count) break;
      const pref = preferredMaterial[axis];
      if (!pref || exclude.includes(pref) || picks.some((p) => p.name === pref)) {
        continue;
      }
      const m = MATERIAL_POOL.find(
        (mm) => mm.name === pref && mm.roles.includes(role),
      );
      if (m) picks.push(m);
    }
    return picks;
  }

  function fillByAxisWalk(
    role: 'top' | 'heart' | 'base',
    count: number,
    exclude: string[],
    picks: BespokeMaterial[],
  ): BespokeMaterial[] {
    for (const axis of ranked) {
      if (picks.length >= count) break;
      const candidates = MATERIAL_POOL.filter(
        (m) =>
          m.roles.includes(role) &&
          m.axis === axis &&
          !exclude.includes(m.name) &&
          !picks.some((p) => p.name === m.name),
      );
      for (const c of candidates) {
        if (picks.length >= count) break;
        picks.push(c);
      }
    }
    return picks;
  }

  function pickForRole(
    role: 'top' | 'heart' | 'base',
    count: number,
    exclude: string[],
  ): BespokeMaterial[] {
    let picks: BespokeMaterial[] = [];
    picks = placePreferredFirst(role, count, exclude, picks);
    picks = fillByAxisWalk(
      role,
      count,
      exclude.concat(picks.map((p) => p.name)),
      picks,
    );
    return picks;
  }

  const used: string[] = [];
  const topPicks = pickForRole('top', 1, used);
  const topPick =
    topPicks[0] || MATERIAL_POOL.find((m) => m.name === 'Bergamot')!;
  used.push(topPick.name);

  const heartPicks = pickForRole('heart', 2, used);
  heartPicks.forEach((m) => used.push(m.name));

  let basePicks = pickForRole('base', 2, used);
  if (basePicks.length === 0) {
    basePicks = [
      MATERIAL_POOL.find((m) => m.name === 'Iso E Super')!,
      MATERIAL_POOL.find((m) => m.name === 'Galaxolide')!,
    ];
  }
  basePicks.forEach((m) => used.push(m.name));

  let topPct = 20;
  let heartPct = 40;
  let basePct = 40;
  if (intensity === 'light') {
    topPct = 32;
    heartPct = 36;
    basePct = 32;
  }
  if (intensity === 'bold') {
    topPct = 10;
    heartPct = 35;
    basePct = 55;
  }
  if (longevity === 'short') {
    topPct += 6;
    basePct -= 6;
  }
  if (longevity === 'long') {
    topPct -= 6;
    basePct += 6;
  }
  topPct = Math.max(6, topPct);
  basePct = Math.max(20, basePct);

  const formula: BespokeResult['formula'] = [];
  let accentMat: BespokeMaterial | null = null;
  if (uniqueness === 'bold' && top4) {
    const accentCands = MATERIAL_POOL.filter(
      (m) => m.axis === top4 && !used.includes(m.name),
    );
    if (accentCands.length) accentMat = accentCands[0];
  }
  const accentPct = accentMat ? 8 : 0;
  const total = topPct + heartPct + basePct;
  topPct = Math.round((topPct / total) * (100 - accentPct));
  heartPct = Math.round((heartPct / total) * (100 - accentPct));
  basePct = 100 - accentPct - topPct - heartPct;

  formula.push({ role: 'Top', materials: [topPick], pct: topPct });
  formula.push({ role: 'Heart', materials: heartPicks, pct: heartPct });
  formula.push({ role: 'Base', materials: basePicks, pct: basePct });
  if (accentMat) {
    formula.push({ role: 'Accent', materials: [accentMat], pct: accentPct });
    used.push(accentMat.name);
  }

  const nb1 = NAME_WORDS[top1];
  const nb2 = NAME_WORDS[top2] || NAME_WORDS[top1];
  const perfumeName = `${nb1.adj[Math.floor(Math.random() * nb1.adj.length)]} ${nb2.noun[Math.floor(Math.random() * nb2.noun.length)]}`;

  const moodPara = `A fragrance built around ${AXIS_DESC[top1]}, softened with a touch of ${AXIS_DESC[top2]}. ${
    intensity === 'bold'
      ? 'Composed to be felt across the room.'
      : intensity === 'light'
        ? 'Composed to stay close and quiet.'
        : 'Composed to last, without shouting.'
  }`;

  function bestAnswerFor(axis: BespokeAxis): BespokeAnswerEntry | null {
    let best: BespokeAnswerEntry | null = null;
    let bestVal = 0;
    answers.forEach((a) => {
      if (!a || !a.w) return;
      const v = a.w[axis] || 0;
      if (v > bestVal) {
        bestVal = v;
        best = a;
      }
    });
    return best;
  }

  const whyItems = ([top1, top2] as BespokeAxis[]).filter(Boolean).map((axis) => {
    const src = bestAnswerFor(axis);
    const base = WHY[axis];
    return src
      ? `"${src.label}" was your strongest signal here — ${base}`
      : base;
  });

  const top1FollowupAnswer = answers.find(
    (a) => a && a.dynType === 'followup' && a.forAxis === top1,
  );
  if (top1FollowupAnswer) {
    whyItems.push(
      `For the ${top1} in your blend, you chose "${top1FollowupAnswer.label}" — so it's built around ${top1FollowupAnswer.material}.`,
    );
  }

  const usedNamesSet = new Set(used);
  const candidateCats = new Set(
    [AXIS_TO_CATEGORY[top1], AXIS_TO_CATEGORY[top2], AXIS_TO_CATEGORY[top3]].filter(
      Boolean,
    ),
  );
  const inspired = ACCORD_LIBRARY.filter((a) => candidateCats.has(a.category))
    .map((a) => {
      const overlap = a.ingredients.filter((n) => usedNamesSet.has(n)).length;
      return { ...a, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);

  return {
    perfumeName,
    moodPara,
    formula,
    whyItems,
    inspired,
    topPct,
    heartPct,
    basePct,
    top1,
    top2,
    intensity,
    longevity,
  };
}
