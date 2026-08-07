/**
 * Pure traversal over the question graph — no I/O, no React. Given a graph
 * and the running state, decide which node should actually be shown next
 * and where an answer routes to.
 */

import type { Dimension, Fingerprint, FluencyTier, QuestionGraph, QuestionNode } from "./types.js";

export type ConditionState = {
  fingerprint: Fingerprint;
  fluencyScore: number;
  fluencyTier: FluencyTier | null;
  /** Every node id shown so far, for gates like "visited(I-veto)". */
  visitedNodeIds: string[];
  /** How many questions have already been answered, for the budget below. */
  questionsAnswered: number;
};

/**
 * The consultation's own promise — "Fifteen questions. None of them about
 * perfume.", and meta.target_questions_shown — enforced rather than assumed.
 *
 * The graph holds far more questions than it shows, and which ones fire is
 * decided by conditions rather than by a counter, so the promise used to be
 * a property of how the paths happened to line up. It didn't hold: a
 * customer who picks "just make me something beautiful" and then answers in
 * sophisticated ways (a2-trace, a5-only-me, an oud veto — each carrying
 * fluency_points) crosses the fluency>=5 threshold *after* already taking
 * the full narrative branch, so the expert deep-dive opens on top of it and
 * the walk reaches eighteen.
 *
 * The last question is always the one where the customer names the thing,
 * so the budget reserves a slot for it: fourteen others, then NAME.
 */
export const QUESTION_BUDGET = 15;

/** Every node the customer actually answers. Routers are invisible plumbing;
 *  ACT3-RENDER is the terminal reveal, not a question. */
function isQuestionNode(node: QuestionNode): boolean {
  return "type" in node && node.type !== "conditional_router";
}

/**
 * The graph's single name_entry node, found by shape rather than by a
 * hardcoded "NAME" so this can't silently target the wrong node if the
 * graph is renamed. Returns null if there isn't exactly one, in which case
 * the budget is not enforced at all — better to overrun the promise than to
 * strand a customer on a node that doesn't exist.
 */
function terminalQuestionId(graph: QuestionGraph): string | null {
  const found = Object.keys(graph.nodes).filter((id) => {
    const node = graph.nodes[id];
    return "type" in node && node.type === "name_entry";
  });
  return found.length === 1 ? found[0] : null;
}

export function getNode(graph: QuestionGraph, id: string): QuestionNode {
  const node = graph.nodes[id];
  if (!node) throw new Error(`Unknown question node: "${id}"`);
  return node;
}

/** ACT3-RENDER is the only node with no `type` key — presentational, not answerable. */
export function isAct3Render(node: QuestionNode): node is Extract<QuestionNode, { blocks: unknown }> {
  return !("type" in node);
}

const NUMERIC_ATOM = /^\s*([a-z_]+)\s*(>=|<=|==|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/i;
const STRING_EQ_ATOM = /^\s*([a-zA-Z_]+)\s*==\s*([a-zA-Z_]+)\s*$/;
const VISITED_ATOM = /^\s*visited\(([\w-]+)\)\s*$/i;

/**
 * Evaluates the condition-string vocabulary used in questions.json: the
 * literal "default"; an OR-of-AND-clauses of `key op number` atoms on a
 * fingerprint dimension or fluency_score (e.g. "musky >= 3 or aldehydic >=
 * 2"); `fluencyTier == perfumer` (string equality, ported from the gate
 * logic that used to be hardcoded JS: "if (session.fluencyTier ===
 * 'perfumer') ..."); or `visited(NODE_ID)` (was `session.history.some(h =>
 * h.nodeId === "...")`) for gates that branch on whether a node was already
 * shown earlier in this session, regardless of which path led here. Plain
 * ASCII operators throughout — the raw file has no HTML-escaped comparisons.
 */
export function evaluateCondition(condition: string, state: ConditionState): boolean {
  const trimmed = condition.trim();
  if (trimmed.toLowerCase() === "default") return true;
  return trimmed
    .split(/\s+or\s+/i)
    .some((clause) => clause.split(/\s+and\s+/i).every((atom) => evaluateAtom(atom, state)));
}

function evaluateAtom(atom: string, state: ConditionState): boolean {
  const visited = VISITED_ATOM.exec(atom);
  if (visited) return state.visitedNodeIds.includes(visited[1]);

  const numeric = NUMERIC_ATOM.exec(atom);
  if (numeric) {
    const [, key, op, rawValue] = numeric;
    const value = Number(rawValue);
    const actual = key === "fluency_score" ? state.fluencyScore : (state.fingerprint[key as Dimension] ?? 0);
    switch (op) {
      case ">=":
        return actual >= value;
      case "<=":
        return actual <= value;
      case ">":
        return actual > value;
      case "<":
        return actual < value;
      case "==":
        return actual === value;
      default:
        throw new Error(`Unsupported condition operator: "${op}"`);
    }
  }

  const stringEq = STRING_EQ_ATOM.exec(atom);
  if (stringEq) {
    const [, key, word] = stringEq;
    if (key === "fluencyTier") return state.fluencyTier === word;
    throw new Error(`Unrecognised condition key for string equality: "${key}"`);
  }

  throw new Error(`Unrecognised condition atom: "${atom}"`);
}

/**
 * Where a conditional node routes to when it does NOT fire. Nodes that carry
 * their own `next` (multi_select/free_text/name_entry/candidate_select) use
 * that directly. single_select nodes have no node-level `next` — every
 * option branches independently — so a skippable single_select must have
 * all its options agree on where they lead. In practice every single_select
 * that carries a `condition` (the fluency_score >= 5 expert-tier nodes) is
 * only ever reached downstream of a gate that already guarantees the
 * condition is true, so this path is a safety net, not a normal route —
 * this is an invariant of the data, not something the schema guarantees, so
 * it's asserted (throws) rather than assumed.
 */
function skipTarget(node: QuestionNode): string {
  if ("next" in node && typeof node.next === "string") return node.next;
  if ("type" in node && node.type === "single_select") {
    const nexts = new Set(node.options.map((option) => option.next).filter(Boolean));
    if (nexts.size !== 1) {
      throw new Error(
        "Cannot skip a single_select node whose options don't agree on where to go next",
      );
    }
    return [...nexts][0] as string;
  }
  throw new Error("Node has a condition but no way to resolve where to skip to");
}

/**
 * Walks forward from `startId`, skipping any conditional node whose
 * condition evaluates false against the current state and auto-resolving
 * any conditional_router (e.g. GATE-fluency — a pure routing node with no
 * UI of its own, decided by its `routes[]` rather than shown as a
 * question), and returns the id of the first node that should actually be
 * rendered. A loop, not a single hop: I-texture and I-bitter can both be
 * skipped back-to-back, and a skip can land on another router.
 */
export function resolveVisibleNodeId(graph: QuestionGraph, state: ConditionState, startId: string): string {
  // Out of budget: cut straight to the naming question rather than walking
  // the rest of the graph. A jump, not a skip-chain — skipTarget can't
  // resolve a single_select whose options genuinely diverge (B1's anchors go
  // 71 different ways), and this has to be total.
  const terminalId = terminalQuestionId(graph);
  const outOfBudget = terminalId !== null && state.questionsAnswered >= QUESTION_BUDGET - 1;

  let id = startId;
  for (let hops = 0; hops < 50; hops++) {
    const node = getNode(graph, id);
    if ("type" in node && node.type === "conditional_router") {
      const routed = resolveNext(node, undefined, state);
      if (!routed) throw new Error(`conditional_router "${id}" produced no route for the current state`);
      id = routed;
      continue;
    }
    if (outOfBudget && id !== terminalId && isQuestionNode(node)) return terminalId as string;
    if (!node.condition || evaluateCondition(node.condition, state)) return id;
    id = skipTarget(node);
  }
  throw new Error(`resolveVisibleNodeId: too many hops starting from "${startId}" — possible cycle`);
}

/**
 * Where an answered node routes to. Only single_select and
 * conditional_router ever branch on the answer itself — every other type
 * (multi_select/free_text/name_entry/candidate_select) has one fixed
 * node-level `next` regardless of what was answered.
 */
export function resolveNext(
  node: QuestionNode,
  selectedOptionId: string | undefined,
  state: ConditionState,
): string | null {
  if (!("type" in node)) return null; // ACT3-RENDER: terminal
  switch (node.type) {
    case "single_select": {
      const option = node.options.find((o) => o.id === selectedOptionId);
      return option?.next ?? null;
    }
    case "multi_select":
    case "free_text":
    case "name_entry":
    case "candidate_select":
    case "catalogue_select":
      return node.next;
    case "conditional_router":
      for (const route of node.routes) {
        if (route.condition === "default" || evaluateCondition(route.condition, state)) {
          return route.next;
        }
      }
      return null;
    default:
      return null;
  }
}
