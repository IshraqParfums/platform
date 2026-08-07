/**
 * Deterministic, client-safe copy generation for NAME's three offered
 * names and the Act III reveal (ACT3-RENDER: "what I heard" / "what I'll
 * build", depth gated by fluency tier per BESPOKE_ENGINE_SPEC.md §3.2/§7.5).
 * Operates only on the small matched-accord objects a server action
 * returns, and on the answer log already sitting in EngineState.
 */

import type { Accord, Dimension, EngineState, Fingerprint, FluencyTier } from "./types.js";

function capitalize(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

function firstFragment(label: string, maxWords: number): string {
  const segment = label.split(/[,.—–]/)[0]?.trim() ?? label;
  return segment.split(/\s+/).slice(0, maxWords).join(" ");
}

function findAnswer(state: EngineState, nodeId: string) {
  return state.answers.find((a) => a.nodeId === nodeId);
}

function findAnswerByPrefix(state: EngineState, prefix: string) {
  return state.answers.find((a) => a.nodeId.startsWith(prefix));
}

/** NAME's offer_generated_names: 3 candidates, built from anchor/accent/texture/modifiers. */
export function generateNames(state: EngineState): string[] {
  const isIndirect = state.flags.includes("indirect_path");
  const anchor = !isIndirect ? findAnswer(state, "B1") : undefined;
  const accent = findAnswerByPrefix(state, "B2-");
  const texture = state.answers.find((a) => a.nodeId.startsWith("B3-") || a.nodeId.startsWith("B4-"));

  const anchorWord = anchor ? capitalize(firstFragment(anchor.label, 2)) : "";
  const accentWord = accent ? capitalize(firstFragment(accent.label, 3)) : "";
  const textureWord = texture ? capitalize(firstFragment(texture.label, 3)) : "";
  const { patina, moisture } = state.modifiers;
  const modWord = patina > 0 ? "Faded" : patina < 0 ? "Bright" : moisture > 0 ? "Dewy" : "Quiet";

  const candidates = [
    anchorWord,
    anchorWord && `${modWord} ${anchorWord}`,
    accentWord,
    textureWord,
    anchorWord && accentWord && `${anchorWord} and ${accentWord}`,
    `${modWord} Hour`,
    "Signature Blend",
  ].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()));

  const seen = new Set<string>();
  const unique = candidates.filter((candidate) => (seen.has(candidate) ? false : (seen.add(candidate), true)));
  return unique.slice(0, 3);
}

/** "What I heard" — reflects the customer's own answers back before any perfumer language. */
export function buildWhatIHeard(state: EngineState): string {
  const anchor = findAnswer(state, "B1");
  const accent = findAnswerByPrefix(state, "B2-");
  const texture = state.answers.find((a) => a.nodeId.startsWith("B3-") || a.nodeId.startsWith("B4-"));
  const a2 = findAnswer(state, "A2");
  const a3 = findAnswer(state, "A3");
  const a5 = findAnswer(state, "A5");

  const memoryParts = [anchor?.label, accent?.label, texture?.label].filter(Boolean);
  const memory = memoryParts.length ? `It started with ${memoryParts.join(" — ").toLowerCase()}.` : "";
  // A2 and A5 options are self-contained phrases ("Warmth. Something people
  // move closer to", "Only me — but let it stay all day, like a real attar")
  // rather than fragments meant to complete a sentence, so they're quoted
  // back rather than spliced into one — splicing broke on almost every
  // option's punctuation and capitalization.
  const arrival = a2 ? `When you walk into a room, you want this to arrive with you: "${a2.label}"` : "";
  const weather = a3 ? `You'll wear this mostly through ${a3.label.toLowerCase()}.` : "";
  const presence = a5 ? `And on who's allowed to notice, and how long it should stay: "${a5.label}"` : "";

  return [memory, arrival, weather, presence].filter(Boolean).join(" ");
}

const FAMILY_MOOD: Record<Dimension, { adj: string }> = {
  floral: { adj: "soft, radiant" },
  woody: { adj: "warm, grounded" },
  spicy: { adj: "lively, warming" },
  green: { adj: "crisp, garden-fresh" },
  aldehydic: { adj: "bright, sparkling" },
  gourmand: { adj: "sweet, comforting" },
  animalic: { adj: "warm, skin-close" },
  earthy: { adj: "damp, mossy" },
  citrus: { adj: "sunlit" },
  musky: { adj: "quiet, close" },
};

const DIMENSION_LABEL: Record<Dimension, string> = {
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

/**
 * Customer-facing label for an expert-tier candidate card. accord.name is
 * an internal/authoring label — for accords sourced from a plain Act I
 * option it's literally that option's text verbatim (e.g. "Someone I'm
 * trying to say something to"), which reads fine as an id but not as
 * something to show a customer choosing between three bottles.
 */
export function describeCandidate(accord: Accord): string {
  const dims = dominantDimensions(accord.vector, 2);
  if (dims.length === 0) return "A quiet, close blend";
  return dims.map((dim) => DIMENSION_LABEL[dim]).join(" & ");
}

function dominantDimensions(vector: Fingerprint, count: number): Dimension[] {
  return (Object.entries(vector) as [Dimension, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([dim]) => dim);
}

/**
 * "What I'll build" — depth by fluency tier per §7.5: lover gets poetry
 * only, enthusiast adds named materials with no percentages, perfumer adds
 * the perfumer's own note verbatim (the dual-column table itself is
 * rendered separately, straight from accord.formula, not through copy).
 */
export function buildWhatIWillBuild(accord: Accord, tier: FluencyTier): string {
  const [primary, secondary] = dominantDimensions(accord.vector, 2);
  const primaryMood = FAMILY_MOOD[primary]?.adj ?? "distinctive";
  const secondaryMood = secondary ? FAMILY_MOOD[secondary]?.adj : null;

  const lover = secondaryMood
    ? `A ${primaryMood} fragrance, softened with something ${secondaryMood} underneath. Built to be felt, not explained.`
    : `A ${primaryMood} fragrance, built to be felt, not explained.`;
  if (tier === "lover") return lover;

  const byPosition = (position: "top" | "heart" | "base") =>
    accord.formula.find((line) => line.note_position === position)?.material_name;
  const named = [byPosition("top"), byPosition("heart"), byPosition("base")].filter(Boolean);
  const enthusiast = named.length ? `${lover} Built around ${named.join(", ")}.` : lover;
  if (tier === "enthusiast") return enthusiast;

  return `${enthusiast}\n\n${accord.note_to_perfumer}`;
}

/** The "and one more thing" divergence-gate framing (§5.1) — never call it a runner-up. */
export const DIVERGENCE_FRAMING =
  "There were two answers. I've made you the one I'd bet on — and a small vial of the other one, " +
  "because I wasn't entirely sure, and you should be the one to decide.";
