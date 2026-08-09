/**
 * Data assembly for the admin Library tool: every accord in the 1,081-entry
 * library, browsable in one place, plus the IFRA notes for a single
 * accord's flagged materials.
 *
 * Ported from the Bespoke prototype's web/lib/bespoke/library.ts, adapted
 * from Next.js server-only helpers into plain synchronous functions the
 * NestJS admin-bespoke module calls — same adaptation atelier.ts already
 * did for the bench tool's own accord search/load.
 */

import { loadAccords, loadMaterials } from "./load-data.js";
import type { Accord, Dimension } from "./types.js";

export interface LibraryAccordSummary {
  id: string;
  name: string;
  inspiration: string;
  composite: boolean;
  layer: string | null;
  primaryFamily: Dimension | null;
  secondaryFamily: Dimension | null;
  vector: Record<Dimension, number>;
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
  /** The IFRA Category 4 limit, as a percentage of the FINISHED product —
   *  not directly comparable to the accord's own neatPct, which is
   *  pre-dilution. That gap is exactly why this needs a human, not an
   *  automatic pass/fail. */
  ifraCat4Pct: number | null;
  ifraNote: string;
}

export interface LibraryAccordDetail {
  id: string;
  name: string;
  inspiration: string;
  source: { nodeId: string | null; optionId: string; layer: string | null };
  composite: boolean;
  vector: Record<Dimension, number>;
  modifiers: { patina: number; moisture: number };
  primaryFamily: Dimension;
  secondaryFamily: Dimension;
  noteToPerfumer: string;
  formula: LibraryFormulaLine[];
  neatLoadPct: number;
  attarSafe: boolean;
  batchGReference: number;
  /** IFRA notes for accord.ifra_verify_materials — already the subset with
   *  a real restriction, computed here rather than the caller re-deriving
   *  it from a second endpoint round trip. */
  ifraNotes: LibraryIfraNote[];
}

export function listLibraryAccordSummaries(): LibraryAccordSummary[] {
  const accords = loadAccords().accords as unknown as Accord[];
  return accords.map((a) => ({
    id: a.id,
    name: a.name,
    inspiration: a.inspiration,
    composite: a.composite,
    layer: a.source.layer,
    primaryFamily: a.family_cluster?.primary ?? null,
    secondaryFamily: a.family_cluster?.secondary ?? null,
    vector: a.vector,
  }));
}

function ifraNotesFor(materialIds: string[]): LibraryIfraNote[] {
  const materials = loadMaterials().materials as unknown as {
    id: string;
    name: string;
    ifra_cat4_pct: number | null;
    ifra_note: string;
  }[];
  const byId = new Map(materials.map((m) => [m.id, m]));
  return materialIds.map((id) => {
    const m = byId.get(id);
    return {
      materialId: id,
      materialName: m?.name ?? id,
      ifraCat4Pct: m?.ifra_cat4_pct ?? null,
      ifraNote: m?.ifra_note ?? "No IFRA note on file for this material — verify manually before use.",
    };
  });
}

export function getLibraryAccordDetail(id: string): LibraryAccordDetail | null {
  const accords = loadAccords().accords as unknown as Accord[];
  const accord = accords.find((a) => a.id === id);
  if (!accord) return null;

  return {
    id: accord.id,
    name: accord.name,
    inspiration: accord.inspiration,
    source: {
      nodeId: accord.source.node_id,
      optionId: accord.source.option_id,
      layer: accord.source.layer,
    },
    composite: accord.composite,
    vector: accord.vector,
    modifiers: { patina: accord.modifiers.patina, moisture: accord.modifiers.moisture },
    primaryFamily: accord.family_cluster.primary,
    secondaryFamily: accord.family_cluster.secondary,
    noteToPerfumer: accord.note_to_perfumer,
    formula: accord.formula.map((line) => ({
      materialId: line.material_id,
      materialName: line.material_name,
      neatPct: line.neat_pct,
      notePosition: line.note_position,
      today: {
        stockDilutionPct: line.today.stock_dilution_pct,
        solvent: line.today.solvent,
        gramsAt10gBatch: line.today.grams_at_10g_batch,
      },
      later: { gramsNeatAt10gBatch: line.later.grams_neat_at_10g_batch },
      benchWarning: line.bench_warning,
    })),
    neatLoadPct: accord.neat_load_pct,
    attarSafe: accord.attar_safe,
    batchGReference: accord.batch_g_reference,
    ifraNotes: ifraNotesFor(accord.ifra_verify_materials),
  };
}
