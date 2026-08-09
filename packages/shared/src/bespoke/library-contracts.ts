import type { BespokeDimension } from "./palette.js";

/**
 * Cross-boundary contracts for the admin Library tool (admin/bespoke/library).
 * Same rule as atelier-contracts.ts: the web app never imports
 * @ishraqparfums/bespoke-engine directly — these are the shapes the Nest
 * admin-bespoke-library endpoints return and the library UI consumes.
 */

export interface LibraryAccordSummary {
  id: string;
  name: string;
  inspiration: string;
  composite: boolean;
  layer: string | null;
  primaryFamily: BespokeDimension | null;
  secondaryFamily: BespokeDimension | null;
  vector: Record<BespokeDimension, number>;
}

export interface LibraryFormulaLine {
  materialId: string;
  materialName: string;
  neatPct: number;
  notePosition: "top" | "heart" | "base";
  today: { stockDilutionPct: number; solvent: string | null; gramsAt10gBatch: number };
  later: { gramsNeatAt10gBatch: number };
  benchWarning: string | null;
}

export interface LibraryIfraNote {
  materialId: string;
  materialName: string;
  ifraCat4Pct: number | null;
  ifraNote: string;
}

export interface LibraryAccordDetail {
  id: string;
  name: string;
  inspiration: string;
  source: { nodeId: string | null; optionId: string; layer: string | null };
  composite: boolean;
  vector: Record<BespokeDimension, number>;
  modifiers: { patina: number; moisture: number };
  primaryFamily: BespokeDimension;
  secondaryFamily: BespokeDimension;
  noteToPerfumer: string;
  formula: LibraryFormulaLine[];
  neatLoadPct: number;
  attarSafe: boolean;
  batchGReference: number;
  ifraNotes: LibraryIfraNote[];
}
