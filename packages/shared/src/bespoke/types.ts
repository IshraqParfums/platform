export type BespokeAxis =
  | 'citrus'
  | 'green'
  | 'aquatic'
  | 'floral'
  | 'woody'
  | 'amber'
  | 'gourmand'
  | 'spicy'
  | 'powdery'
  | 'musk'
  | 'smoky';

export type BespokeRole = 'top' | 'heart' | 'base';

export interface BespokeMaterial {
  name: string;
  axis: BespokeAxis;
  roles: BespokeRole[];
  desc: string;
}

export interface BespokeAccord {
  id: string;
  name: string;
  category: string;
  mood: string;
  ingredients: string[];
}

export interface BespokeFormulaMaterial {
  name: string;
  axis: BespokeAxis;
  roles: BespokeRole[];
  desc: string;
}

export interface BespokeFormulaRow {
  role: 'Top' | 'Heart' | 'Base' | 'Accent';
  materials: BespokeFormulaMaterial[];
  pct: number;
}

export interface BespokeInspiredAccord {
  id: string;
  name: string;
  category: string;
  mood: string;
  ingredients: string[];
  overlap: number;
}

export interface BespokeResult {
  perfumeName: string;
  moodPara: string;
  formula: BespokeFormulaRow[];
  whyItems: string[];
  inspired: BespokeInspiredAccord[];
  topPct: number;
  heartPct: number;
  basePct: number;
  top1: BespokeAxis;
  top2: BespokeAxis;
  intensity: string;
  longevity: string;
}

/** Answer snapshot entry as produced by the quiz engine / FE. */
export type BespokeAnswerEntry = {
  qText: string;
  label: string;
  meta?: string;
  value?: string;
  w?: Partial<Record<BespokeAxis, number>>;
  dynType?: 'followup' | 'exclude' | 'uniqueness';
  forAxis?: BespokeAxis;
  material?: string;
  exclude?: BespokeAxis | null;
  forceLight?: boolean;
};

export interface CoreQuestionOption {
  label: string;
  w?: Partial<Record<BespokeAxis, number>>;
  value?: string;
}

export interface CoreQuestion {
  id: number;
  text: string;
  meta?: 'intensity' | 'longevity';
  options: CoreQuestionOption[];
}

export interface AxisFollowupOption {
  label: string;
  material: string;
}

export interface AxisFollowup {
  text: string;
  options: AxisFollowupOption[];
}

export interface PrecisionQuestionOption {
  label: string;
  exclude?: BespokeAxis | null;
  forceLight?: boolean;
  value?: string;
}

export interface PrecisionQuestion {
  key: 'exclude' | 'uniqueness';
  text: string;
  options: PrecisionQuestionOption[];
}

export interface Phase2Question {
  text: string;
  options: Array<
    | AxisFollowupOption
    | PrecisionQuestionOption
  >;
  dynType: 'followup' | 'exclude' | 'uniqueness';
  forAxis?: BespokeAxis;
}
