/**
 * Pure reducer: given the running state and a customer's answer to the
 * current node, returns the next state. No I/O — graph.ts decides routing,
 * this file only accumulates the fingerprint/modifiers/constraints/fluency
 * that routing (and, later, matching) depend on.
 */

import { getNode, resolveNext, resolveVisibleNodeId } from "./graph.js";
import type {
  Answer,
  Constraints,
  ConstraintPayload,
  Dimension,
  EngineState,
  Modifiers,
  Option,
  QuestionGraph,
} from "./types.js";
import { DIMENSIONS } from "./types.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mergeVector(fingerprint: EngineState["fingerprint"], vector?: Partial<Record<Dimension, number>>) {
  if (!vector) return fingerprint;
  const next = { ...fingerprint };
  for (const dim of DIMENSIONS) {
    const delta = vector[dim];
    if (delta) next[dim] += delta;
  }
  return next;
}

function scaleVector(vector: Record<Dimension, number>, factor: number): Partial<Record<Dimension, number>> {
  const scaled: Partial<Record<Dimension, number>> = {};
  for (const dim of DIMENSIONS) scaled[dim] = vector[dim] * factor;
  return scaled;
}

function dominantDimension(vector: Record<Dimension, number>): Dimension | null {
  let best: Dimension | null = null;
  let bestValue = 0;
  for (const dim of DIMENSIONS) {
    if (vector[dim] > bestValue) {
      best = dim;
      bestValue = vector[dim];
    }
  }
  return best;
}

function mergeModifiers(modifiers: Modifiers, delta?: Partial<Modifiers>): Modifiers {
  if (!delta) return modifiers;
  return {
    patina: clamp(modifiers.patina + (delta.patina ?? 0), -3, 3),
    moisture: clamp(modifiers.moisture + (delta.moisture ?? 0), -3, 3),
  };
}

function union(existing: string[], additions?: string[]): string[] {
  if (!additions || additions.length === 0) return existing;
  const set = new Set(existing);
  for (const item of additions) set.add(item);
  return [...set];
}

function minMerge(
  existing: Record<string, number>,
  additions?: Record<string, number>,
): Record<string, number> {
  if (!additions) return existing;
  const next = { ...existing };
  for (const [key, value] of Object.entries(additions)) {
    next[key] = key in next ? Math.min(next[key], value) : value;
  }
  return next;
}

/**
 * Merges one option's constraint payload into the running Constraints.
 * Collections (materials/families) union or take the most restrictive
 * value seen; scalar/enum fields (pyramid_ratio, projection,
 * concentration_shift) use last-write-wins / sum, since later answers in
 * the flow are more specific refinements of the same signal — this also
 * means an I-expert-* answer naturally overrides an earlier Act I one
 * without needing its `overrides_act1_pyramid` flag to be read specially.
 */
function mergeConstraint(constraints: Constraints, payload?: ConstraintPayload): Constraints {
  if (!payload) return constraints;
  return {
    vetoMaterials: union(constraints.vetoMaterials, payload.veto_materials),
    capMaterials: minMerge(constraints.capMaterials, payload.cap_materials),
    capFamilies: minMerge(
      constraints.capFamilies as Record<string, number>,
      payload.cap_families as Record<string, number> | undefined,
    ) as Partial<Record<Dimension, number>>,
    capPatina:
      payload.cap_patina === undefined
        ? constraints.capPatina
        : constraints.capPatina === null
          ? payload.cap_patina
          : Math.min(constraints.capPatina, payload.cap_patina),
    boostMaterials: union(constraints.boostMaterials, payload.boost_materials),
    boostFamilies: payload.boost_families
      ? { ...constraints.boostFamilies, ...payload.boost_families }
      : constraints.boostFamilies,
    boostHeartNotes: constraints.boostHeartNotes || Boolean(payload.boost_heart_notes),
    pyramidRatio: payload.pyramid_ratio ?? constraints.pyramidRatio,
    concentrationShift: constraints.concentrationShift + (payload.concentration_shift ?? 0),
    fixativeBoost: constraints.fixativeBoost || Boolean(payload.fixative_boost),
    sillageCap: constraints.sillageCap || Boolean(payload.sillage_cap),
    projection: payload.projection ?? constraints.projection,
    reduceBaseLoad: constraints.reduceBaseLoad || Boolean(payload.reduce_base_load),
    reduceTopLoad: constraints.reduceTopLoad || Boolean(payload.reduce_top_load),
    notes: payload.note ? [...constraints.notes, payload.note] : constraints.notes,
  };
}

/**
 * I-anosmia's backend effect ("infer_anosmic_material") is spec'd as a
 * material *substitution* inside the formula — that's the on-the-fly
 * composition engine this v1 deliberately doesn't build (see
 * BESPOKE_ENGINE_SPEC.md §4.2 vs the v1 scope cuts). The safe v1
 * approximation: identify which base-musk they mean from the followup
 * free text, then bias matching away from accords that lean heavily on
 * it, the same mechanism a veto-question answer would use.
 */
function matchAnosmicMaterial(substitutions: Record<string, string[]>, followupText?: string): string | null {
  if (!followupText) return null;
  const needle = followupText.toLowerCase();
  return (
    Object.keys(substitutions).find((materialId) => needle.includes(materialId.replace(/_/g, " "))) ?? null
  );
}

function applyAnosmiaEffect(constraints: Constraints, matchedMaterial: string | null): Constraints {
  if (!matchedMaterial) return constraints;
  return {
    ...constraints,
    capMaterials: minMerge(constraints.capMaterials, { [matchedMaterial]: 1 }),
  };
}

function optionLabel(options: Option[], ids: string[]): string {
  return ids
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .join(", ");
}

/** Applies one answer to `state` and advances to the next visible node. */
export function applyAnswer(graph: QuestionGraph, state: EngineState, answer: Answer): EngineState {
  const node = getNode(graph, state.currentNodeId);
  const next: EngineState = { ...state };
  let selectedOptionIds: string[] = [];
  let recordLabel = "";
  let recordText: string | undefined;
  let perfumeName: string | undefined;
  let dedication: string | undefined;

  if (answer.kind === "select" && "options" in node) {
    selectedOptionIds = answer.optionIds;
    const chosen = node.options.filter((o) => selectedOptionIds.includes(o.id));
    recordLabel = optionLabel(node.options, selectedOptionIds);
    for (const option of chosen) {
      next.fingerprint = mergeVector(next.fingerprint, option.vector);
      next.modifiers = mergeModifiers(next.modifiers, option.modifiers);
      next.constraints = mergeConstraint(next.constraints, option.constraint);
      next.fluencyScore += option.fluency_points ?? 0;
      if (option.flags) next.flags = union(next.flags, option.flags);
      if (option.fluency_tier) next.fluencyTier = option.fluency_tier;
      if (option.output) next.outputChoice = option.output;
      if (option.backend?.action === "infer_anosmic_material" && option.backend.substitutions) {
        const matched = matchAnosmicMaterial(option.backend.substitutions, answer.followupText);
        next.anosmiaMaterial = matched;
        next.constraints = applyAnosmiaEffect(next.constraints, matched);
      }
    }
  } else if (answer.kind === "free_text") {
    recordText = answer.text;
    recordLabel = answer.text;
    // I-ref-a/b/c's backend.apply (references.json lookup) is a documented
    // v1 no-op: data/references.json was never built. The answer is still
    // recorded for the Act III reveal and future use.
  } else if (answer.kind === "name") {
    perfumeName = answer.perfumeName;
    dedication = answer.dedication;
    recordLabel = answer.perfumeName;
  } else if (answer.kind === "candidate") {
    selectedOptionIds = [answer.accordId];
    recordLabel = answer.accordId;
  } else if (answer.kind === "catalogue_reference") {
    recordLabel = answer.perfumeName ?? "None of these";
    if (answer.profile && "sentiment" in node) {
      if (node.sentiment === "like") {
        next.fingerprint = mergeVector(next.fingerprint, scaleVector(answer.profile, 0.6));
      } else {
        next.fingerprint = mergeVector(next.fingerprint, scaleVector(answer.profile, -0.4));
        const dominant = dominantDimension(answer.profile);
        if (dominant) {
          next.constraints = {
            ...next.constraints,
            capFamilies: { ...next.constraints.capFamilies, [dominant]: 0 },
          };
        }
      }
    }
  }

  next.answers = [
    ...next.answers,
    {
      nodeId: state.currentNodeId,
      type: "type" in node ? node.type : "act3_render",
      optionIds: selectedOptionIds,
      label: recordLabel,
      text: recordText,
      perfumeName,
      dedication,
    },
  ];

  const conditionState = {
    fingerprint: next.fingerprint,
    fluencyScore: next.fluencyScore,
    fluencyTier: next.fluencyTier,
    visitedNodeIds: next.visitedNodeIds,
    // next.answers already includes the answer just given, so this is the
    // count *after* this question — exactly what the budget should see.
    questionsAnswered: next.answers.length,
  };
  const nextId = resolveNext(node, selectedOptionIds[0], conditionState);
  if (!nextId) {
    next.finished = true;
    return next;
  }
  next.currentNodeId = resolveVisibleNodeId(graph, conditionState, nextId);
  if (!next.visitedNodeIds.includes(next.currentNodeId)) {
    next.visitedNodeIds = [...next.visitedNodeIds, next.currentNodeId];
  }
  return next;
}
