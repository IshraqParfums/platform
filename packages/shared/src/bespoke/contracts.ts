import type { BespokeDimension } from "./palette.js";

export const BESPOKE_ENGINE_VERSION = "2";

/** Composite snapshot stored on BespokePerfume.formulaJson and OrderItem.formulaJson. */
export interface BespokeFormulaSnapshotV2 {
  schemaVersion: 2;
  bottle: BespokeAccordSnapshot;
  sample: BespokeAccordSnapshot;
  fingerprint: Record<BespokeDimension, number>;
  modifiers: { patina: number; moisture: number };
  constraintsSummary: BespokeConstraintsSummary;
  colorTheme: BespokeColorTheme;
}

export interface BespokeAccordFormulaLine {
  material_id: string;
  material_name: string;
  neat_pct: number;
  note_position: "top" | "heart" | "base";
  today: {
    stock_dilution_pct: number;
    solvent: string | null;
    grams_at_10g_batch: number;
  };
  later: { grams_neat_at_10g_batch: number };
  bench_warning: string | null;
}

export interface BespokeAccordSnapshot {
  id: string;
  name: string;
  inspiration: string;
  vector: Record<BespokeDimension, number>;
  modifiers: { patina: number; moisture: number };
  family_cluster: {
    primary: BespokeDimension;
    secondary: BespokeDimension;
  };
  note_to_perfumer: string;
  formula: BespokeAccordFormulaLine[];
  neat_load_pct: number;
  attar_safe: boolean;
  ifra_verify_materials: string[];
  batch_g_reference: number;
}

export interface BespokeConstraintsSummary {
  vetoMaterials: string[];
  capMaterials: Record<string, number>;
  capFamilies: Partial<Record<BespokeDimension, number>>;
  capPatina: number | null;
  boostMaterials: string[];
  notes: string[];
  projection: string | null;
}

export interface BespokeColorTheme {
  primary: BespokeDimension | null;
  secondary: BespokeDimension | null;
  accent: string;
}

/** Customer-facing brew — never includes formula / neat_pct / note_to_perfumer. */
export interface BespokePerfumeCustomerResponse {
  id: string;
  name: string;
  dedication: string | null;
  engineVersion: string;
  graphVersion: string;
  colorTheme: BespokeColorTheme;
  brief: string;
  whatIHeard: string;
  sampleFraming: string;
  familyPrimary: BespokeDimension | null;
  familySecondary: BespokeDimension | null;
  clientKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One answered question, resolved server-side against the graph the
 *  session was actually answered on — the admin view has no graph of its
 *  own to guess node text from. */
export interface BespokeAnswerLogEntry {
  nodeId: string;
  questionText: string;
  answerText: string;
}

/** Admin / production sheet — full bottle + sample. */
export interface BespokePerfumeAdminResponse {
  id: string;
  name: string;
  dedication: string | null;
  customerId: string | null;
  engineVersion: string;
  graphVersion: string;
  formula: BespokeFormulaSnapshotV2;
  state: unknown;
  /** Question-by-question record of the consultation, in answer order. */
  answerLog: BespokeAnswerLogEntry[];
  colorTheme: BespokeColorTheme;
  deletedAt: string | null;
  clientKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Admin list row — enough to triage a queue without shipping a formula. */
export interface BespokeAdminListItem {
  id: string;
  name: string;
  dedication: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  engineVersion: string;
  graphVersion: string;
  colorTheme: BespokeColorTheme;
  familyPrimary: BespokeDimension | null;
  familySecondary: BespokeDimension | null;
  bottleName: string | null;
  sampleName: string | null;
  deletedAt: string | null;
  createdAt: string;
}

/** One node in the consultation funnel: how many sessions got this far. */
export interface BespokeFunnelStep {
  nodeId: string;
  nodeText: string;
  sessions: number;
  dropOff: number;
}

export interface BespokeAdminAnalytics {
  rangeDays: number;
  sessionsStarted: number;
  sessionsActive: number;
  sessionsCompleted: number;
  sessionsClaimed: number;
  sessionsExpired: number;
  completionRate: number;
  claimRate: number;
  averageQuestionsAnswered: number;
  steps: BespokeFunnelStep[];
}

export interface BespokeSessionProgress {
  questionsAnswered: number;
  questionBudget: number;
}

export interface BespokePublicOption {
  id: string;
  label: string;
  flags?: string[];
  highlight?: string;
  echo?: string;
  note_to_perfumer?: string;
  exclusive?: boolean;
  followup_free_text?: string;
  /** False when the follow-up is optional — present only when explicitly
   *  false; absent means required (the historical default). */
  followup_required?: boolean;
  fluency_tier?: string;
}

export interface BespokePublicNode {
  id: string;
  act: number;
  layer: string;
  type:
    | "single_select"
    | "multi_select"
    | "free_text"
    | "name_entry"
    | "candidate_select"
    | "catalogue_select"
    | "act3_render";
  text?: string;
  text_gift?: string;
  disclosure_copy?: string;
  optional?: boolean;
  skip_label?: string;
  options?: BespokePublicOption[];
  fields?: {
    perfume_name: { min: number; max: number; required: boolean };
    dedication: {
      min: number;
      max: number;
      required: boolean;
      placeholder?: string;
    };
  };
  offer_generated_names?: number;
  generatedNames?: string[];
  sentiment?: "like" | "dislike";
  blocks?: {
    id: string;
    heading: string;
    content: string;
    copy?: string;
  }[];
  min_candidates?: number;
  max_candidates?: number;
}

export interface BespokeCandidateCard {
  id: string;
  label: string;
  notesByPosition: {
    top: string[];
    heart: string[];
    base: string[];
  };
}

export interface BespokeSessionCreateResponse {
  sessionId: string;
  sessionToken: string;
  /** Optimistic-concurrency stamp to send back with the next answer. */
  version: number;
  node: BespokePublicNode;
  progress: BespokeSessionProgress;
  expiresAt: string;
}

/**
 * Read-only preview of the engine's live start node — no session is
 * created. Used by the homepage teaser so its copy can never drift from
 * the graph the real quiz reads.
 */
export interface BespokeStartNodePreviewResponse {
  nodeId: string;
  /** Engine graph version (semver-ish string), not a session's optimistic-concurrency int. */
  graphVersion: string;
  node: BespokePublicNode;
}

export interface BespokeSessionViewResponse {
  sessionId: string;
  status: string;
  /** Optimistic-concurrency stamp to send back with the next answer. */
  version: number;
  node: BespokePublicNode | null;
  progress: BespokeSessionProgress;
  finished: boolean;
  shortlist: BespokeCandidateCard[] | null;
  expiresAt: string;
  resultAvailable: boolean;
  brewId: string | null;
  /** The chosen (or generated) perfume name, once a result exists — null
   *  before then. Lets the landing page's list of finished consultations
   *  read as "View Kulhad Rain" instead of an unlabelled "View result"
   *  repeated once per session. */
  name: string | null;
}

export type BespokeAnswerBody =
  | { kind: "select"; optionIds: string[]; followupText?: string }
  | { kind: "free_text"; text: string }
  | {
      kind: "name";
      perfumeName: string;
      dedication?: string;
      nameSource: "customer_typed" | "chose_offered";
    }
  | { kind: "candidate"; accordId: string }
  | {
      kind: "catalogue_reference";
      perfumeId: string | null;
      perfumeName: string | null;
    };

export interface BespokeAnswerRequest {
  nodeId: string;
  version: number;
  answer: BespokeAnswerBody;
}

/** Customer-safe note names — no percentages or bench data. */
export interface BespokeNotesByPosition {
  top: string[];
  heart: string[];
  base: string[];
}

export interface BespokeSessionResultResponse {
  sessionId: string;
  name: string;
  dedication: string | null;
  colorTheme: BespokeColorTheme;
  brief: string;
  whatIHeard: string;
  sampleFraming: string;
  familyPrimary: BespokeDimension | null;
  familySecondary: BespokeDimension | null;
  notesByPosition: BespokeNotesByPosition;
  brewId: string | null;
  claimed: boolean;
}

export interface RenameBespokeBody {
  name: string;
}

export interface BespokePricingConfig {
  paisePerMl: number;
  allowedSizesMl: number[];
}

export interface BespokeReferenceProduct {
  id: string;
  name: string;
  slug: string;
  profile: Record<BespokeDimension, number>;
}

export interface BespokeScentProfile {
  floral: number;
  woody: number;
  spicy: number;
  green: number;
  aldehydic: number;
  gourmand: number;
  animalic: number;
  earthy: number;
  citrus: number;
  musky: number;
}

/** Legacy v1 snapshot shape (admin sheet only). */
export interface BespokeFormulaSnapshotV1 {
  schemaVersion?: 1;
  formula: unknown;
  perfumeName: string;
  moodPara: string;
  whyItems: string[];
  inspired?: unknown;
  topPct?: number;
  heartPct?: number;
  basePct?: number;
}
