/**
 * Types for the bespoke consultation engine — the question graph in
 * data/questions.json, the accord library in data/accords.json, and the
 * running state the quiz accumulates as a customer answers.
 *
 * `Dimension` matches `ScentProfile`'s ten axes exactly (@/components/perfume-slider)
 * on purpose: a fingerprint built here can be ranked against the retail
 * catalogue's own `profile` field with no conversion.
 */

export type Dimension =
  | "floral"
  | "woody"
  | "spicy"
  | "green"
  | "aldehydic"
  | "gourmand"
  | "animalic"
  | "earthy"
  | "citrus"
  | "musky";

export const DIMENSIONS: Dimension[] = [
  "floral",
  "woody",
  "spicy",
  "green",
  "aldehydic",
  "gourmand",
  "animalic",
  "earthy",
  "citrus",
  "musky",
];

export type Fingerprint = Record<Dimension, number>;

export function emptyFingerprint(): Fingerprint {
  return {
    floral: 0,
    woody: 0,
    spicy: 0,
    green: 0,
    aldehydic: 0,
    gourmand: 0,
    animalic: 0,
    earthy: 0,
    citrus: 0,
    musky: 0,
  };
}

export interface Modifiers {
  patina: number;
  moisture: number;
}

export type FluencyTier = "lover" | "enthusiast" | "perfumer";

export type Projection = "high" | "low" | "intimate";

export interface PyramidRatio {
  top: number;
  heart: number;
  base: number;
}

export interface OutputChoice {
  format: "edt" | "edp" | "attar";
  label: string;
  concentration_pct: [number, number];
  attar_path: boolean;
  base_note_boost?: boolean;
}

/** The raw payload shape carried on `option.constraint` in questions.json. */
export interface ConstraintPayload {
  veto_materials?: string[];
  cap_materials?: Record<string, number>;
  cap_families?: Partial<Record<Dimension, number>>;
  cap_patina?: number;
  boost_materials?: string[];
  boost_families?: Partial<Record<Dimension, number>>;
  boost_heart_notes?: boolean;
  concentration_shift?: number;
  fixative_boost?: boolean;
  sillage_cap?: boolean;
  pyramid_ratio?: PyramidRatio;
  overrides_act1_pyramid?: boolean;
  projection?: Projection;
  reduce_base_load?: boolean;
  reduce_top_load?: boolean;
  note?: string;
}

/** Constraints accumulated across every answered option, ready to score/filter with. */
export interface Constraints {
  vetoMaterials: string[];
  capMaterials: Record<string, number>;
  capFamilies: Partial<Record<Dimension, number>>;
  capPatina: number | null;
  boostMaterials: string[];
  boostFamilies: Partial<Record<Dimension, number>>;
  boostHeartNotes: boolean;
  pyramidRatio: PyramidRatio | null;
  concentrationShift: number;
  fixativeBoost: boolean;
  sillageCap: boolean;
  projection: Projection | null;
  reduceBaseLoad: boolean;
  reduceTopLoad: boolean;
  /** Free-text constraint.note annotations, kept for the perfumer-tier reveal. */
  notes: string[];
}

export function emptyConstraints(): Constraints {
  return {
    vetoMaterials: [],
    capMaterials: {},
    capFamilies: {},
    capPatina: null,
    boostMaterials: [],
    boostFamilies: {},
    boostHeartNotes: false,
    pyramidRatio: null,
    concentrationShift: 0,
    fixativeBoost: false,
    sillageCap: false,
    projection: null,
    reduceBaseLoad: false,
    reduceTopLoad: false,
    notes: [],
  };
}

export interface BackendEffect {
  lookup?: string;
  apply?: string;
  action?: string;
  substitutions?: Record<string, string[]>;
}

export interface Option {
  id: string;
  label: string;
  flags?: string[];
  vector?: Partial<Fingerprint>;
  modifiers?: Partial<Modifiers>;
  constraint?: ConstraintPayload;
  /** Absent on multi_select options — those branch via the node's own `next`. */
  next?: string;
  followup_free_text?: string;
  fluency_tier?: FluencyTier;
  fluency_points?: number;
  output?: OutputChoice;
  composite?: boolean;
  note_to_perfumer?: string;
  exclusive?: boolean;
  backend?: BackendEffect;
  /** Short badge text (e.g. "A favourite for this") shown as a small pill on
   *  the option card — GIFT-OCCASION's wedding-night/anniversary options, so
   *  far. Sparingly: it's a signal, not decoration, so most options carry
   *  none. */
  highlight?: string;
  /**
   * One line handed back to the customer after they choose this — the moment
   * the consultation proves it was listening. Authored in the house voice for
   * the "lover" tier; higher tiers hear `note_to_perfumer` instead. Absent on
   * most options on purpose: see scripts/add_echoes.py.
   */
  echo?: string;
}

interface BaseNode {
  act: number;
  layer: string;
  text?: string;
  /** Alternate phrasing shown when the customer flagged this as a gift (A1 "gift"/"gift_intent"). */
  text_gift?: string;
  design_note?: string;
  /** Reassurance copy shown above a catalogue_select node — what this pick will and won't do. */
  disclosure_copy?: string;
  /**
   * e.g. "fluency_score >= 5", "musky >= 3 or aldehydic >= 2 or floral >= 3",
   * "fluencyTier == perfumer", "visited(I-veto)".
   */
  condition?: string;
  always_fires?: boolean;
  compulsory?: boolean;
  display?: string;
}

export interface SingleSelectNode extends BaseNode {
  type: "single_select";
  options: Option[];
}

export interface MultiSelectNode extends BaseNode {
  type: "multi_select";
  options: Option[];
  /** Options don't branch on a multi_select; the node itself points onward. */
  next: string;
}

export interface FreeTextNode extends BaseNode {
  type: "free_text";
  optional?: boolean;
  backend?: BackendEffect;
  next: string;
}

export interface ConditionalRouterNode extends BaseNode {
  type: "conditional_router";
  logic?: string;
  routes: { condition: string; next: string }[];
}

export interface NameEntryNode extends BaseNode {
  type: "name_entry";
  fields: {
    perfume_name: { type: string; min: number; max: number; required: boolean };
    dedication: {
      type: string;
      min: number;
      max: number;
      required: boolean;
      placeholder?: string;
    };
  };
  offer_generated_names?: number;
  generation_inputs?: string[];
  track?: string[];
  next: string;
}

export interface CandidateSelectNode extends BaseNode {
  type: "candidate_select";
  backend?: { reads?: string; action?: string; renders?: string };
  min_candidates: number;
  max_candidates: number;
  on_select?: { action?: string; divergent_sample?: string; note?: string };
  next: string;
}

/**
 * A reference-perfume pick, sourced live from the retail catalogue
 * (web/data/perfumes.json) rather than from static options — replaces the
 * old free-text "name a perfume" questions, which had no lookup table to
 * resolve an arbitrary name against and were a documented no-op. `sentiment`
 * decides how the picked perfume's `profile` is folded into the fingerprint
 * (see engine.ts): "like" adds it at 0.6x, "dislike" subtracts it at 0.4x
 * and caps its dominant family to 0.
 */
export interface CatalogueSelectNode extends BaseNode {
  type: "catalogue_select";
  sentiment: "like" | "dislike";
  optional?: boolean;
  skip_label?: string;
  next: string;
}

/** ACT3-RENDER — the only node with no `type` key. Presentational, not answerable. */
export interface Act3RenderNode {
  act: number;
  layer: "output";
  /** Never actually set on this node — kept so BaseNode-shaped graph code can read it uniformly. */
  condition?: undefined;
  blocks: {
    id: string;
    heading: string;
    content: string;
    depth_by_tier?: Record<FluencyTier, string>;
    copy?: string;
  }[];
  prints_as?: string;
  note?: string;
}

export type QuestionNode =
  | SingleSelectNode
  | MultiSelectNode
  | FreeTextNode
  | ConditionalRouterNode
  | NameEntryNode
  | CandidateSelectNode
  | CatalogueSelectNode
  | Act3RenderNode;

/** Every `type` value across the node union, plus the untyped Act3RenderNode's synthetic tag. */
export type NodeTypeName =
  | "single_select"
  | "multi_select"
  | "free_text"
  | "conditional_router"
  | "name_entry"
  | "candidate_select"
  | "catalogue_select"
  | "act3_render";

export interface QuestionGraph {
  meta: Record<string, unknown>;
  dimensions: Dimension[];
  modifiers: ("patina" | "moisture")[];
  flow: Record<string, unknown>;
  nodes: Record<string, QuestionNode>;
}

/** One answered node, kept for back-navigation, Act III reflection, and naming. */
export interface AnswerRecord {
  nodeId: string;
  type: NodeTypeName;
  optionIds: string[];
  label: string;
  text?: string;
  perfumeName?: string;
  dedication?: string;
}

export interface EngineState {
  currentNodeId: string;
  fingerprint: Fingerprint;
  modifiers: Modifiers;
  constraints: Constraints;
  fluencyScore: number;
  fluencyTier: FluencyTier | null;
  flags: string[];
  anosmiaMaterial: string | null;
  outputChoice: OutputChoice | null;
  answers: AnswerRecord[];
  /** Every node id shown so far (including the current one), for gates like "visited(I-veto)". */
  visitedNodeIds: string[];
  finished: boolean;
}

export function initialEngineState(startNodeId: string): EngineState {
  return {
    currentNodeId: startNodeId,
    fingerprint: emptyFingerprint(),
    modifiers: { patina: 0, moisture: 0 },
    constraints: emptyConstraints(),
    fluencyScore: 0,
    fluencyTier: null,
    flags: [],
    anosmiaMaterial: null,
    outputChoice: null,
    answers: [],
    visitedNodeIds: [startNodeId],
    finished: false,
  };
}

/**
 * The small slice of EngineState a match server action actually needs —
 * never the questions graph, never any accord data. This is what crosses
 * the client/server boundary.
 */
export interface MatchInput {
  fingerprint: Fingerprint;
  modifiers: Modifiers;
  constraints: Constraints;
  outputChoice: OutputChoice | null;
}

export interface AccordFormulaLine {
  material_id: string;
  material_name: string;
  neat_pct: number;
  note_position: "top" | "heart" | "base";
  today: { stock_dilution_pct: number; solvent: string | null; grams_at_10g_batch: number };
  later: { grams_neat_at_10g_batch: number };
  bench_warning: string | null;
}

export interface Accord {
  id: string;
  name: string;
  inspiration: string;
  /** node_id is null for the ~110 "classic reference" accords not sourced from any question option. */
  source: { node_id: string | null; option_id: string; layer: string | null; anchor_context: string[] };
  composite: boolean;
  vector: Fingerprint;
  modifiers: Modifiers;
  family_cluster: { primary: Dimension; secondary: Dimension };
  note_to_perfumer: string;
  formula: AccordFormulaLine[];
  neat_load_pct: number;
  attar_safe: boolean;
  ifra_verify_materials: string[];
  batch_g_reference: number;
}

export interface AccordLibrary {
  meta: Record<string, unknown>;
  accords: Accord[];
}

export interface MatchResult {
  bottle: Accord;
  sample: Accord;
}

/** What the quiz UI submits for a node, shaped by that node's `type`. */
export type Answer =
  | { kind: "select"; optionIds: string[]; followupText?: string }
  | { kind: "free_text"; text: string }
  | {
      kind: "name";
      perfumeName: string;
      dedication?: string;
      nameSource: "customer_typed" | "chose_offered";
    }
  | { kind: "candidate"; accordId: string }
  /**
   * A catalogue_select pick. `profile` travels with the answer (the UI
   * already has the full catalogue in hand) rather than engine.ts needing
   * its own copy of the perfume list just to look one up.
   */
  | { kind: "catalogue_reference"; perfumeId: string | null; perfumeName: string | null; profile: Fingerprint | null };
