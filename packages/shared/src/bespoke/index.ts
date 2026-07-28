export type {
  AxisFollowup,
  AxisFollowupOption,
  BespokeAccord,
  BespokeAnswerEntry,
  BespokeAxis,
  BespokeFormulaMaterial,
  BespokeFormulaRow,
  BespokeInspiredAccord,
  BespokeMaterial,
  BespokeResult,
  BespokeRole,
  CoreQuestion,
  CoreQuestionOption,
  Phase2Question,
  PrecisionQuestion,
  PrecisionQuestionOption,
} from './types.js';

export {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_PAISE_PER_ML,
  assertAllowedBespokeSize,
  isAllowedBespokeSize,
  pricePaiseForSize,
} from './pricing.js';

export type {
  BespokeFormulaSnapshot,
  BespokePerfumeResponse,
  BespokePreviewBody,
  BespokePreviewResponse,
  BespokePricingConfig,
  MergeBespokeBody,
  MergeBespokeItemBody,
  MergeBespokeResponse,
  RenameBespokeBody,
  SaveBespokeBody,
} from './contracts.js';

export { MATERIAL_POOL, AXES } from './data/materials.js';
export {
  AXIS_DESC,
  AXIS_TO_CATEGORY,
  NAME_WORDS,
  WHY,
} from './data/copy.js';
export {
  AXIS_FOLLOWUPS,
  CORE_QUESTIONS,
  PRECISION_QUESTIONS,
} from './data/questions.js';
export { ACCORD_LIBRARY } from './data/accord-library.js';

export {
  BESPOKE_ENGINE_VERSION,
  buildPhase2Questions,
  computeResult,
  getAxisMax,
} from './engine/scoring.js';
export type { Phase2BuildResult } from './engine/scoring.js';
