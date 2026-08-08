import type { BespokeDimension } from "./palette.js";

/**
 * Cross-boundary contracts for the Atelier bench tool (admin/bespoke/atelier).
 * The web app never imports @ishraqparfums/bespoke-engine directly — these
 * are the shapes the Nest admin-bespoke-atelier endpoints return and the
 * bench UI consumes.
 */

export type AtelierNotePosition = "top" | "heart" | "base";

export interface AtelierMaterialComposition {
  confidence:
    | "published-range"
    | "supplier-declared"
    | "assay"
    | "proprietary-partial"
    | "proprietary-undisclosed";
  basis: string;
  declared_pct: number;
  undisclosed_pct: number;
  constituents: { id: string; pct: number }[];
}

export interface AtelierMaterial {
  id: string;
  name: string;
  notePosition: AtelierNotePosition;
  strength: number;
  tenacityHours: number;
  evapCurve: string;
  evapIndex: number;
  odour: string;
  facets: string[];
  facetsPrimary: string[];
  facetsSecondary: string[];
  perceptualCluster: string[];
  temperature: number;
  polarity: number;
  emotion: string[];
  colourPercept: string;
  families: Partial<Record<BespokeDimension, number>>;
  primaryFamily: BespokeDimension | null;
  typicalRange: [number, number];
  maxNeat: number;
  minEffectivePct: number | null;
  stockDilution: number;
  solvent: string | null;
  ifraCat4Pct: number | null;
  ifraNote: string;
  attarSafe: boolean;
  pairsWith: string[];
  bridges: string[];
  bridgeEffect: string;
  effectInMixture: string;
  keyChemistry: string;
  chemicalFamily: string;
  composition: AtelierMaterialComposition;
}

export interface AtelierConstituent {
  id: string;
  name: string;
  cas: string | null;
  chemical_class: string;
  odour: string;
  facets: string[];
  volatility: "top" | "heart" | "base";
  eu_allergen: boolean;
  note: string;
}

export interface AtelierFacetLexicon {
  aliases: Record<string, string>;
  canonical: Record<string, { label: string; group: string; uses: number }>;
  bridges: Record<string, Record<string, number>>;
}

export interface AtelierTechniqueNote {
  id: string;
  category: string;
  title: string;
  body: string;
  requires_all: string[];
  requires_any: string[][];
  suggests: string[];
  recipe: { material: string; pct: string }[];
  compare: string[];
  compare_labels: string[];
  dose: Record<string, string>;
  off_palette: string[];
  involves: string[];
}

export interface AtelierCataloguePerfume {
  id: string;
  name: string;
  collection?: string;
  profile: Partial<Record<BespokeDimension, number>>;
}

export interface AtelierBootstrap {
  materials: AtelierMaterial[];
  constituents: AtelierConstituent[];
  lexicon: AtelierFacetLexicon;
  techniqueNotes: AtelierTechniqueNote[];
  noteCategories: Record<string, string>;
  catalogue: AtelierCataloguePerfume[];
}

export interface AtelierAccordSummary {
  id: string;
  name: string;
  family: string;
  materialCount: number;
  neatLoadPct: number;
  note: string;
}

export interface AtelierFormulaRow {
  materialId: string;
  neatPct: number;
}

export interface AtelierLoadedAccord {
  id: string;
  name: string;
  rows: AtelierFormulaRow[];
}
