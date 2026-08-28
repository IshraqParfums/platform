export {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_MAX_LINE_QUANTITY,
  BESPOKE_PAISE_PER_ML,
  assertAllowedBespokeSize,
  clampBespokeLineQuantity,
  isAllowedBespokeSize,
  pricePaiseForSize,
} from "./pricing.js";

export {
  BESPOKE_DIMENSIONS,
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  BESPOKE_FAMILY_PALETTE,
  BESPOKE_TEASER_MATERIALS,
} from "./palette.js";

export type {
  BespokeDimension,
  BespokeFamilyPalette,
} from "./palette.js";

export { BESPOKE_ENGINE_VERSION } from "./contracts.js";

export type {
  AtelierAccordSummary,
  AtelierBootstrap,
  AtelierCataloguePerfume,
  AtelierConstituent,
  AtelierFacetLexicon,
  AtelierFormulaRow,
  AtelierLoadedAccord,
  AtelierMaterial,
  AtelierMaterialComposition,
  AtelierNotePosition,
  AtelierTechniqueNote,
} from "./atelier-contracts.js";

export type {
  LibraryAccordDetail,
  LibraryAccordSummary,
  LibraryFormulaLine,
  LibraryIfraNote,
} from "./library-contracts.js";

/**
 * Client-safe Atelier bench engine — pure functions, no fs/Node access.
 * Mirror of packages/bespoke-engine's affinity/volatility/impression/suggest
 * (same math, same source, only the wire-type imports differ), so the bench
 * UI can recompute on every keystroke without a round trip to the API. See
 * packages/bespoke-engine/src/atelier.ts for the server-side counterpart
 * that assembles the palette from data/materials.json etc.
 */
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
} from "./atelier/affinity.js";

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
} from "./atelier/affinity.js";

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
} from "./atelier/volatility.js";

export type {
  BenchWarning,
  FormulaRow,
  MaterialSeries,
  NotePosition,
  PyramidSplit,
  VolatilityModel,
} from "./atelier/volatility.js";

export {
  buildImpression,
  temperatureWord,
  weightWord,
} from "./atelier/impression.js";

export type {
  CataloguePerfume,
  Impression,
  ImpressionAct,
  NearestPerfume,
} from "./atelier/impression.js";

export {
  doseRemedies,
  findGaps,
  suggestNext,
  suggestOpeners,
} from "./atelier/suggest.js";

export type {
  DoseRemedy,
  Gap,
  GapKind,
  Suggestion,
  SuggestionReason,
} from "./atelier/suggest.js";

export type {
  BespokeAccordFormulaLine,
  BespokeAccordSnapshot,
  BespokeAdminAnalytics,
  BespokeAdminListItem,
  BespokeAnswerBody,
  BespokeAnswerLogEntry,
  BespokeAnswerRequest,
  BespokeCandidateCard,
  BespokeColorTheme,
  BespokeConstraintsSummary,
  BespokeFormulaSnapshotV1,
  BespokeFormulaSnapshotV2,
  BespokeFunnelStep,
  BespokeNotesByPosition,
  BespokePerfumeAdminResponse,
  BespokePerfumeCustomerResponse,
  BespokePricingConfig,
  BespokePublicNode,
  BespokePublicOption,
  BespokeReferenceProduct,
  BespokeScentProfile,
  BespokeSessionCreateResponse,
  BespokeSessionProgress,
  BespokeSessionResultResponse,
  BespokeSessionViewResponse,
  RenameBespokeBody,
} from "./contracts.js";
