/**
 * Deterministic walk driver over the question graph.
 * Shared by our-port and upstream runners so seeds are comparable.
 */

import type {
  Answer,
  EngineState,
  Fingerprint,
  QuestionGraph,
  QuestionNode,
} from "../types.js";
import { emptyFingerprint } from "../types.js";
import { applyAnswer } from "../engine.js";
import { getNode, isAct3Render } from "../graph.js";
import {
  matchExpertFinal,
  matchExpertShortlist,
  matchFingerprint,
} from "../match.js";
import { pickIndex, mulberry32 } from "./prng.js";

export interface WalkEngines {
  applyAnswer: typeof applyAnswer;
  getNode: typeof getNode;
  isAct3Render: typeof isAct3Render;
  matchFingerprint: typeof matchFingerprint;
  matchExpertShortlist: typeof matchExpertShortlist;
  matchExpertFinal: typeof matchExpertFinal;
  initialState: (startNodeId: string) => EngineState;
}

export interface WalkResult {
  fingerprint: Fingerprint;
  modifiers: EngineState["modifiers"];
  constraints: EngineState["constraints"];
  visitedNodeIds: string[];
  answersLength: number;
  bottleId: string;
  sampleId: string;
  finished: boolean;
}

function syntheticProfile(rand: () => number): Fingerprint {
  const fp = emptyFingerprint();
  const keys = Object.keys(fp) as (keyof Fingerprint)[];
  const a = keys[pickIndex(rand, keys.length)];
  const b = keys[pickIndex(rand, keys.length)];
  fp[a] = 1 + pickIndex(rand, 4);
  fp[b] = 1 + pickIndex(rand, 3);
  return fp;
}

function chooseAnswer(
  node: QuestionNode,
  rand: () => number,
  shortlistIds: string[],
): Answer {
  if (!("type" in node)) {
    throw new Error("cannot answer act3_render");
  }

  switch (node.type) {
    case "single_select": {
      const idx = pickIndex(rand, node.options.length);
      const option = node.options[idx];
      const followupText = option.followup_free_text
        ? "galaxolide soft musk"
        : undefined;
      return { kind: "select", optionIds: [option.id], followupText };
    }
    case "multi_select": {
      // Always pick 1–2 options, honour exclusive by picking only one when exclusive fires
      const exclusive = node.options.filter((o) => o.exclusive);
      if (exclusive.length && rand() < 0.3) {
        return {
          kind: "select",
          optionIds: [exclusive[pickIndex(rand, exclusive.length)].id],
        };
      }
      const count = 1 + pickIndex(rand, Math.min(2, node.options.length));
      const shuffled = [...node.options].sort(() => rand() - 0.5);
      return {
        kind: "select",
        optionIds: shuffled.slice(0, count).map((o) => o.id),
      };
    }
    case "free_text":
      return { kind: "free_text", text: "parity free text note" };
    case "name_entry":
      return {
        kind: "name",
        perfumeName: "Parity Blend",
        dedication: "for the harness",
        nameSource: "customer_typed",
      };
    case "candidate_select": {
      const id =
        shortlistIds[pickIndex(rand, shortlistIds.length)] ?? shortlistIds[0];
      if (!id) throw new Error("candidate_select with empty shortlist");
      return { kind: "candidate", accordId: id };
    }
    case "catalogue_select": {
      // Sometimes skip (optional), otherwise synthetic profile
      if (rand() < 0.35) {
        return {
          kind: "catalogue_reference",
          perfumeId: null,
          perfumeName: null,
          profile: null,
        };
      }
      return {
        kind: "catalogue_reference",
        perfumeId: "parity-perfume",
        perfumeName: "Parity Reference",
        profile: syntheticProfile(rand),
      };
    }
    case "conditional_router":
      throw new Error("conditional_router should never be visible");
    default:
      throw new Error(`unhandled node type`);
  }
}

export function runWalk(
  graph: QuestionGraph,
  seed: number,
  engines: WalkEngines,
): WalkResult {
  const rand = mulberry32(seed);
  const startId =
    typeof graph.meta?.start_node === "string"
      ? graph.meta.start_node
      : "I-fluency";

  let state = engines.initialState(startId);
  // Resolve first visible node the same way a session would
  // initialEngineState already starts at startId; clone quiz may need resolveVisible —
  // for I-fluency it is already visible.
  let steps = 0;
  let shortlistIds: string[] = [];

  while (!state.finished && steps < 40) {
    steps += 1;
    const node = engines.getNode(graph, state.currentNodeId);

    if (engines.isAct3Render(node)) {
      // Terminal reveal — finish without answering
      state = { ...state, finished: true };
      break;
    }

    if ("type" in node && node.type === "candidate_select") {
      const shortlist = engines.matchExpertShortlist({
        fingerprint: state.fingerprint,
        modifiers: state.modifiers,
        constraints: state.constraints,
        outputChoice: state.outputChoice,
      });
      shortlistIds = shortlist.map((a) => a.id);
    }

    const answer = chooseAnswer(node, rand, shortlistIds);
    state = engines.applyAnswer(graph, state, answer);
  }

  if (!state.finished) {
    // Force finish for matching if we somehow stalled
    state = { ...state, finished: true };
  }

  const matchInput = {
    fingerprint: state.fingerprint,
    modifiers: state.modifiers,
    constraints: state.constraints,
    outputChoice: state.outputChoice,
  };

  const chosenAccordId = state.answers.find(
    (a) => a.type === "candidate_select",
  )?.optionIds[0];

  const { bottle, sample } = chosenAccordId
    ? engines.matchExpertFinal(
        chosenAccordId,
        engines.matchExpertShortlist(matchInput),
      )
    : engines.matchFingerprint(matchInput);

  return {
    fingerprint: state.fingerprint,
    modifiers: state.modifiers,
    constraints: state.constraints,
    visitedNodeIds: state.visitedNodeIds,
    answersLength: state.answers.length,
    bottleId: bottle.id,
    sampleId: sample.id,
    finished: state.finished,
  };
}

export function summarize(result: WalkResult): string {
  return JSON.stringify({
    fingerprint: result.fingerprint,
    modifiers: result.modifiers,
    constraints: result.constraints,
    visitedNodeIds: result.visitedNodeIds,
    answersLength: result.answersLength,
    bottleId: result.bottleId,
    sampleId: result.sampleId,
  });
}
