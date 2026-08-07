#!/usr/bin/env node
/**
 * Syncs the v2 bespoke engine sources + data JSON from BESPOKE_UPSTREAM
 * (default: ~/Bespoke) into packages/bespoke-engine.
 *
 * Only allowed edits: rewrite import paths so the package is self-contained.
 * Run `pnpm bespoke:verify` to assert no other drift.
 */

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM =
  process.env.BESPOKE_UPSTREAM?.trim() || join(homedir(), "Bespoke");
const PKG = join(ROOT, "packages/bespoke-engine");
const SRC_OUT = join(PKG, "src");
const DATA_OUT = join(PKG, "data");

const ENGINE_FILES = [
  "types.ts",
  "similarity.ts",
  "graph.ts",
  "engine.ts",
  "copy.ts",
  "family-colors.ts",
  "match.ts",
];

const DATA_FILES = [
  "questions.json",
  "accords.json",
  "materials.json",
  "constituents.json",
  "facet-lexicon.json",
  "technique-notes.json",
];

function die(message) {
  console.error(`bespoke-sync: ${message}`);
  process.exit(1);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function rewriteImports(source, fileName) {
  let next = source;

  // match.ts: accords JSON from package data/
  if (fileName === "match.ts") {
    next = next.replace(
      /import accordData from ["']@bespoke-data\/accords\.json["'];/,
      'import { loadAccords } from "./load-data.js";',
    );
    next = next.replace(
      /const ACCORDS: Accord\[\] = \(accordData as unknown as AccordLibrary\)\.accords;/,
      "const ACCORDS: Accord[] = loadAccords().accords;",
    );
    // AccordLibrary was only used for the JSON cast — drop it after rewrite.
    next = next.replace(
      /import type \{([^}]+)\} from ["']\.\/types(?:\.js)?["'];/,
      (_m, types) => {
        const cleaned = types
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && t !== "AccordLibrary")
          .join(", ");
        return `import type { ${cleaned} } from "./types.js";`;
      },
    );
  }

  // NodeNext: add .js extensions on relative imports that lack them
  next = next.replace(
    /from ["'](\.\/[^"']+)["']/g,
    (_m, spec) => {
      if (spec.endsWith(".js") || spec.endsWith(".json")) {
        return `from "${spec}"`;
      }
      return `from "${spec}.js"`;
    },
  );

  return next;
}

function ensureUpstream() {
  if (!existsSync(UPSTREAM)) {
    die(`upstream not found at ${UPSTREAM}. Set BESPOKE_UPSTREAM.`);
  }
  const lib = join(UPSTREAM, "web/lib/bespoke");
  const data = join(UPSTREAM, "data");
  if (!existsSync(lib) || !existsSync(data)) {
    die(`upstream layout unexpected under ${UPSTREAM}`);
  }
  return { lib, data };
}

function sync() {
  const { lib, data } = ensureUpstream();
  mkdirSync(SRC_OUT, { recursive: true });
  mkdirSync(DATA_OUT, { recursive: true });

  const checksums = {};

  for (const name of ENGINE_FILES) {
    const from = join(lib, name);
    if (!existsSync(from)) die(`missing engine file: ${from}`);
    const raw = readFileSync(from, "utf8");
    const rewritten = rewriteImports(raw, name);
    writeFileSync(join(SRC_OUT, name), rewritten);
    checksums[`src/${name}`] = {
      upstreamSha256: sha256File(from),
      note: "source rewritten for package imports only",
    };
  }

  for (const name of DATA_FILES) {
    const from = join(data, name);
    if (!existsSync(from)) die(`missing data file: ${from}`);
    copyFileSync(from, join(DATA_OUT, name));
    checksums[`data/${name}`] = {
      sha256: sha256File(from),
      bytes: statSync(from).size,
    };
  }

  // Expected counts from upstream (asserted at boot)
  const questions = JSON.parse(readFileSync(join(DATA_OUT, "questions.json"), "utf8"));
  const accords = JSON.parse(readFileSync(join(DATA_OUT, "accords.json"), "utf8"));
  const materials = JSON.parse(readFileSync(join(DATA_OUT, "materials.json"), "utf8"));

  const manifest = {
    generatedAt: new Date().toISOString(),
    upstream: UPSTREAM,
    expected: {
      questionNodes: Object.keys(questions.nodes ?? {}).length,
      accords: (accords.accords ?? []).length,
      materials: (materials.materials ?? []).length,
    },
    checksums,
  };

  writeFileSync(
    join(DATA_OUT, "checksums.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(
    `bespoke-sync: wrote ${ENGINE_FILES.length} sources + ${DATA_FILES.length} data files → ${relative(ROOT, PKG)}`,
  );
  console.log(
    `bespoke-sync: expected counts nodes=${manifest.expected.questionNodes} accords=${manifest.expected.accords} materials=${manifest.expected.materials}`,
  );
}

const mode = process.argv[2] ?? "sync";
if (mode === "sync") {
  sync();
} else {
  die(`unknown mode "${mode}" (use: sync)`);
}
