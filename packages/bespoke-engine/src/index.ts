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
  loadConstituents,
  loadFacetLexicon,
  loadMaterials,
  loadQuestions,
  loadTechniqueNotes,
} from "./load-data.js";

export type { BespokeDataChecksums, TechniqueNoteDocument } from "./load-data.js";

/* ------------------------------------------------------------- Atelier -- */

export {
  affinity,
  analyseCohesion,
  bridgedFacets,
  canonicalFacet,
  facetLabel,
  fireNotes,
  FUSED_THRESHOLD,
  ORPHAN_THRESHOLD,
  rollUpConstituents,
  sharedConstituents,
  sharedFacets,
  suggestBridges,
} from "./affinity.js";

export type {
  Affinity,
  AffinityMaterial,
  BridgeSuggestion,
  BridgedFacet,
  CohesionReport,
  Constituent,
  ConstituentTotal,
  FacetLexicon,
  FiredNote,
  MaterialComposition,
  SharedConstituent,
  SharedFacet,
  TechniqueNote,
} from "./affinity.js";

export {
  benchWarnings,
  buildVolatilityModel,
  contributionAt,
  decayExponent,
  dominantAt,
  estimatedWearHours,
  MAX_HOURS,
  onsetAt,
  onsetFloor,
  onsetPeakHours,
  pyramidSplit,
  remainingAt,
  TIME_TICKS,
  timeToFraction,
} from "./volatility.js";

export type {
  AtelierMaterial,
  BenchWarning,
  FormulaRow,
  MaterialSeries,
  NotePosition,
  PyramidSplit,
  VolatilityModel,
} from "./volatility.js";

export { buildImpression, temperatureWord, weightWord } from "./impression.js";

export type {
  CataloguePerfume,
  Impression,
  ImpressionAct,
  NearestPerfume,
} from "./impression.js";

export {
  doseRemedies,
  findGaps,
  suggestNext,
  suggestOpeners,
} from "./suggest.js";

export type {
  DoseRemedy,
  Gap,
  GapKind,
  Suggestion,
  SuggestionReason,
} from "./suggest.js";

export {
  buildConstituentsById,
  buildMaterialsById,
  buildPairsWith,
  getAtelierChemistry,
  getAtelierMaterials,
  loadAtelierAccord,
  searchAtelierAccords,
} from "./atelier.js";

export type {
  AtelierAccordSummary,
  AtelierChemistry,
  AtelierLoadedAccord,
} from "./atelier.js";

/* -------------------------------------------------------------- Library -- */

export { getLibraryAccordDetail, listLibraryAccordSummaries } from "./library.js";

export type {
  LibraryAccordDetail,
  LibraryAccordSummary,
  LibraryFormulaLine,
  LibraryIfraNote,
} from "./library.js";
