/**
 * @ishraqparfums/bespoke-engine — verbatim v2 consultation engine.
 * Server-side only. Never import from the Next.js web app.
 */

export type {
  Accord,
  AccordFormulaLine,
  AccordLibrary,
  Answer,
  AnswerRecord,
  Constraints,
  ConstraintPayload,
  Dimension,
  EngineState,
  Fingerprint,
  FluencyTier,
  MatchInput,
  MatchResult,
  Modifiers,
  Option,
  OutputChoice,
  PyramidRatio,
  QuestionGraph,
  QuestionNode,
  NodeTypeName,
} from "./types.js";

export {
  DIMENSIONS,
  emptyConstraints,
  emptyFingerprint,
  initialEngineState,
} from "./types.js";

export { applyAnswer } from "./engine.js";

export {
  evaluateCondition,
  getNode,
  isAct3Render,
  QUESTION_BUDGET,
  resolveNext,
  resolveVisibleNodeId,
} from "./graph.js";

export {
  applyConstraintFilters,
  divergenceGate,
  matchExpertFinal,
  matchExpertShortlist,
  matchFingerprint,
  pickMoreDistant,
  rankAccords,
} from "./match.js";

export type { RankedAccord } from "./match.js";

export { cosineDistance, cosineSimilarity } from "./similarity.js";

export {
  buildWhatIHeard,
  buildWhatIWillBuild,
  describeCandidate,
  DIVERGENCE_FRAMING,
  generateNames,
} from "./copy.js";

export {
  dominantDimension,
  FAMILY_COLOR,
  FAMILY_PALETTE,
  secondaryDimension,
} from "./family-colors.js";

export type { FamilyPalette } from "./family-colors.js";

export {
  assertBespokeDataIntegrity,
  BESPOKE_ENGINE_VERSION,
  getDataDir,
  loadAccords,
  loadChecksums,
  loadMaterials,
  loadQuestions,
} from "./load-data.js";

export type { BespokeDataChecksums } from "./load-data.js";
