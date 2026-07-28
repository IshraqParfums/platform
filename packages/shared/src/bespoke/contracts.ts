import type { BespokeAnswerEntry, BespokeResult } from './types.js';

export interface BespokeFormulaSnapshot {
  formula: BespokeResult['formula'];
  perfumeName: string;
  moodPara: string;
  whyItems: string[];
  inspired: BespokeResult['inspired'];
  topPct: number;
  heartPct: number;
  basePct: number;
  top1: string;
  top2: string;
  intensity: string;
  longevity: string;
}

export interface BespokePerfumeResponse {
  id: string;
  name: string;
  formula: BespokeFormulaSnapshot;
  answers: BespokeAnswerEntry[];
  moodText: string;
  why: string[];
  inspired: BespokeResult['inspired'];
  engineVersion: string;
  clientKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveBespokeBody {
  name: string;
  formula: BespokeFormulaSnapshot;
  answers: BespokeAnswerEntry[];
  moodText: string;
  why: string[];
  inspired?: BespokeResult['inspired'];
  engineVersion: string;
  clientKey?: string;
}

export interface MergeBespokeItemBody extends SaveBespokeBody {}

export interface MergeBespokeBody {
  items: MergeBespokeItemBody[];
}

export interface MergeBespokeResponse {
  items: BespokePerfumeResponse[];
}

export interface RenameBespokeBody {
  name: string;
}

export interface BespokePreviewBody {
  answers: BespokeAnswerEntry[];
  /** Optional; if omitted, Phase 2 ranking is rebuilt (may differ due to RNG). */
  interimRanked?: string[];
}

export interface BespokePreviewResponse {
  result: BespokeResult;
  engineVersion: string;
}

export interface BespokePricingConfig {
  paisePerMl: number;
  allowedSizesMl: number[];
}
