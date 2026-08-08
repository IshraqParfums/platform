/**
 * Runtime JSON loaders for packages/bespoke-engine/data.
 * Data stays as JSON on disk (not compiled through tsc) so the 3.2 MB
 * accords library does not bloat the TypeScript build.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Constituent, FacetLexicon } from "./affinity.js";
import type { AccordLibrary, QuestionGraph } from "./types.js";

export interface TechniqueNoteDocument {
  notes: import("./affinity.js").TechniqueNote[];
  categories: Record<string, string>;
  off_palette_materials: string[];
}

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

export interface BespokeDataChecksums {
  generatedAt: string;
  upstream: string;
  expected: {
    questionNodes: number;
    accords: number;
    materials: number;
  };
  checksums: Record<string, { sha256?: string; upstreamSha256?: string; bytes?: number; note?: string }>;
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8")) as T;
}

function sha256File(name: string): string {
  return createHash("sha256").update(readFileSync(join(DATA_DIR, name))).digest("hex");
}

let questionsCache: QuestionGraph | null = null;
let accordsCache: AccordLibrary | null = null;
let materialsCache: { meta: unknown; materials: unknown[] } | null = null;
let checksumsCache: BespokeDataChecksums | null = null;
let constituentsCache: { constituents: Constituent[] } | null = null;
let facetLexiconCache: FacetLexicon | null = null;
let techniqueNotesCache: TechniqueNoteDocument | null = null;

export function getDataDir(): string {
  return DATA_DIR;
}

export function loadChecksums(): BespokeDataChecksums {
  if (!checksumsCache) {
    checksumsCache = readJson<BespokeDataChecksums>("checksums.json");
  }
  return checksumsCache;
}

export function loadQuestions(): QuestionGraph {
  if (!questionsCache) {
    questionsCache = readJson<QuestionGraph>("questions.json");
  }
  return questionsCache;
}

export function loadAccords(): AccordLibrary {
  if (!accordsCache) {
    accordsCache = readJson<AccordLibrary>("accords.json");
  }
  return accordsCache;
}

export function loadMaterials(): { meta: unknown; materials: unknown[] } {
  if (!materialsCache) {
    materialsCache = readJson<{ meta: unknown; materials: unknown[] }>(
      "materials.json",
    );
  }
  return materialsCache;
}

export function loadConstituents(): { constituents: Constituent[] } {
  if (!constituentsCache) {
    constituentsCache = readJson<{ constituents: Constituent[] }>(
      "constituents.json",
    );
  }
  return constituentsCache;
}

export function loadFacetLexicon(): FacetLexicon {
  if (!facetLexiconCache) {
    facetLexiconCache = readJson<FacetLexicon>("facet-lexicon.json");
  }
  return facetLexiconCache;
}

export function loadTechniqueNotes(): TechniqueNoteDocument {
  if (!techniqueNotesCache) {
    techniqueNotesCache = readJson<TechniqueNoteDocument>(
      "technique-notes.json",
    );
  }
  return techniqueNotesCache;
}

/**
 * Boot-time assertion: counts + sha256 of data files must match the
 * sync manifest. Call from Nest onModuleInit — a bad deploy fails here,
 * not on a customer's first question.
 */
export function assertBespokeDataIntegrity(): {
  questionNodes: number;
  accords: number;
  materials: number;
} {
  const manifest = loadChecksums();
  const questions = loadQuestions();
  const accords = loadAccords();
  const materials = loadMaterials();

  const questionNodes = Object.keys(questions.nodes ?? {}).length;
  const accordCount = accords.accords?.length ?? 0;
  const materialCount = materials.materials?.length ?? 0;

  const errors: string[] = [];

  if (questionNodes !== manifest.expected.questionNodes) {
    errors.push(
      `question nodes: got ${questionNodes}, expected ${manifest.expected.questionNodes}`,
    );
  }
  if (accordCount !== manifest.expected.accords) {
    errors.push(`accords: got ${accordCount}, expected ${manifest.expected.accords}`);
  }
  if (materialCount !== manifest.expected.materials) {
    errors.push(
      `materials: got ${materialCount}, expected ${manifest.expected.materials}`,
    );
  }

  for (const [key, entry] of Object.entries(manifest.checksums)) {
    if (!key.startsWith("data/") || !entry.sha256) continue;
    const fileName = key.slice("data/".length);
    const actual = sha256File(fileName);
    if (actual !== entry.sha256) {
      errors.push(`checksum mismatch for ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `bespoke-engine data integrity failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return { questionNodes, accords: accordCount, materials: materialCount };
}

export const BESPOKE_ENGINE_VERSION = "2";
