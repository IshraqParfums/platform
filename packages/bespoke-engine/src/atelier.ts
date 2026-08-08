/**
 * Data assembly for the Atelier bench tool: the material palette shaped for
 * the client, the chemistry reference (constituents/lexicon/technique notes),
 * and accord search/load against the 1,081-accord library.
 *
 * Ported from the Bespoke prototype's web/lib/bespoke/atelier-data.ts and
 * web/app/admin/atelier/actions.ts, adapted from Next.js server-only helpers
 * into plain synchronous functions the NestJS admin-bespoke module calls.
 */

import type { Constituent, FacetLexicon, MaterialComposition, TechniqueNote } from "./affinity.js";
import {
  loadAccords,
  loadConstituents,
  loadFacetLexicon,
  loadMaterials,
  loadTechniqueNotes,
} from "./load-data.js";
import type { Dimension } from "./types.js";
import type { AtelierMaterial, FormulaRow, NotePosition } from "./volatility.js";

interface RawMaterial {
  id: string;
  name: string;
  note_position: NotePosition | null;
  strength: number | null;
  tenacity_hours: number | null;
  evap_curve: string | null;
  evap_index: number | null;
  odour: string | null;
  facets_primary?: string[];
  facets_secondary?: string[];
  perceptual_cluster?: string[];
  temperature?: number;
  polarity?: number;
  emotion?: string[];
  colour_percept?: string;
  families?: Partial<Record<Dimension, number>>;
  typical_neat_range?: [number, number];
  max_neat?: number;
  min_effective_pct?: number | null;
  stock_dilution?: number;
  solvent?: string | null;
  ifra_cat4_pct?: number | null;
  ifra_note?: string;
  attar_safe?: boolean;
  pairs_with?: string[];
  bridges?: string[];
  bridge_effect?: string;
  effect_in_mixture?: string;
  key_chemistry?: string;
  chemical_family?: string;
  composition?: MaterialComposition;
}

const EMPTY_COMPOSITION: MaterialComposition = {
  confidence: "proprietary-undisclosed",
  basis: "No composition on record.",
  declared_pct: 0,
  undisclosed_pct: 100,
  constituents: [],
};

function primaryFamily(families: Partial<Record<Dimension, number>>): Dimension | null {
  let best: Dimension | null = null;
  let bestValue = 0;
  for (const [family, value] of Object.entries(families) as [Dimension, number][]) {
    if (value > bestValue) {
      best = family;
      bestValue = value;
    }
  }
  return best;
}

let materialsCache: AtelierMaterial[] | null = null;

/**
 * The client-facing material palette. Solvents and carriers (dpg, ipm,
 * ethanol) have no families and no odour to plot — they belong in a
 * dilution, not in a formula's curve, so they're filtered out here.
 */
export function getAtelierMaterials(): AtelierMaterial[] {
  if (materialsCache) return materialsCache;
  const raw = (loadMaterials().materials as unknown as RawMaterial[]) ?? [];
  materialsCache = raw
    .filter((m) => m.families && Object.keys(m.families).length > 0)
    .map((m) => ({
      id: m.id,
      name: m.name,
      notePosition: m.note_position ?? "heart",
      strength: m.strength ?? 5,
      tenacityHours: m.tenacity_hours ?? 24,
      evapCurve: m.evap_curve ?? "mid",
      evapIndex: m.evap_index ?? 50,
      odour: m.odour ?? "",
      facets: [...(m.facets_primary ?? []), ...(m.facets_secondary ?? [])],
      facetsPrimary: m.facets_primary ?? [],
      facetsSecondary: m.facets_secondary ?? [],
      perceptualCluster: m.perceptual_cluster ?? [],
      temperature: m.temperature ?? 0,
      polarity: m.polarity ?? 0,
      emotion: m.emotion ?? [],
      colourPercept: m.colour_percept ?? "",
      families: m.families ?? {},
      primaryFamily: primaryFamily(m.families ?? {}),
      typicalRange: m.typical_neat_range ?? [0.1, 5],
      maxNeat: m.max_neat ?? 10,
      minEffectivePct: m.min_effective_pct ?? null,
      stockDilution: m.stock_dilution ?? 1,
      solvent: m.solvent ?? null,
      ifraCat4Pct: m.ifra_cat4_pct ?? null,
      ifraNote: m.ifra_note ?? "",
      attarSafe: m.attar_safe ?? true,
      pairsWith: m.pairs_with ?? [],
      bridges: m.bridges ?? [],
      bridgeEffect: m.bridge_effect ?? "",
      effectInMixture: m.effect_in_mixture ?? "",
      keyChemistry: m.key_chemistry ?? "",
      chemicalFamily: m.chemical_family ?? "",
      composition: m.composition ?? EMPTY_COMPOSITION,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return materialsCache;
}

export interface AtelierChemistry {
  constituents: Constituent[];
  lexicon: FacetLexicon;
  notes: TechniqueNote[];
  offPaletteMaterials: string[];
  noteCategories: Record<string, string>;
}

/** The chemistry reference the Atelier reasons over: molecule records, the
 *  canonical facet vocabulary, and the bench notes. */
export function getAtelierChemistry(): AtelierChemistry {
  const notesDoc = loadTechniqueNotes();
  return {
    constituents: loadConstituents().constituents,
    lexicon: loadFacetLexicon(),
    notes: notesDoc.notes,
    offPaletteMaterials: notesDoc.off_palette_materials,
    noteCategories: notesDoc.categories,
  };
}

export function buildMaterialsById(materials: AtelierMaterial[]): Map<string, AtelierMaterial> {
  return new Map(materials.map((m) => [m.id, m]));
}

export function buildConstituentsById(constituents: Constituent[]): Map<string, Constituent> {
  return new Map(constituents.map((c) => [c.id, c]));
}

/** Hand-authored pairs_with, bidirectionally checked by affinity()/suggestNext(). */
export function buildPairsWith(materials: AtelierMaterial[]): Map<string, Set<string>> {
  return new Map(materials.map((m) => [m.id, new Set(m.pairsWith)]));
}

/* --------------------------------------------------------------- accords */

interface RawAccord {
  id: string;
  name: string;
  note_to_perfumer?: string;
  neat_load_pct?: number;
  family_cluster?: { primary?: string; secondary?: string };
  formula?: { material_id: string; neat_pct: number }[];
}

export interface AtelierAccordSummary {
  id: string;
  name: string;
  family: string;
  materialCount: number;
  neatLoadPct: number;
  note: string;
}

const SEARCH_LIMIT = 10;

/**
 * Opening an existing accord at the bench. Most real bench work is
 * modifying something that already exists, so the search stays a small,
 * frequent lookup rather than shipping the 3.3 MB accord library in bulk.
 */
export function searchAtelierAccords(query: string): AtelierAccordSummary[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const accords = loadAccords().accords as unknown as RawAccord[];
  const matches: RawAccord[] = [];
  for (const accord of accords) {
    if (
      accord.name.toLowerCase().includes(needle) ||
      accord.id.includes(needle) ||
      (accord.note_to_perfumer ?? "").toLowerCase().includes(needle) ||
      (accord.family_cluster?.primary ?? "").includes(needle)
    ) {
      matches.push(accord);
      if (matches.length >= SEARCH_LIMIT) break;
    }
  }

  return matches.map((a) => ({
    id: a.id,
    name: a.name,
    family: [a.family_cluster?.primary, a.family_cluster?.secondary].filter(Boolean).join(" · "),
    materialCount: a.formula?.length ?? 0,
    neatLoadPct: a.neat_load_pct ?? 0,
    note: a.note_to_perfumer ?? "",
  }));
}

export interface AtelierLoadedAccord {
  id: string;
  name: string;
  rows: FormulaRow[];
}

export function loadAtelierAccord(id: string): AtelierLoadedAccord | null {
  const accords = loadAccords().accords as unknown as RawAccord[];
  const accord = accords.find((a) => a.id === id);
  if (!accord?.formula) return null;
  return {
    id: accord.id,
    name: accord.name,
    rows: accord.formula.map((row) => ({
      materialId: row.material_id,
      neatPct: row.neat_pct,
    })),
  };
}
