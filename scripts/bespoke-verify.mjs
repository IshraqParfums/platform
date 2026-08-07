#!/usr/bin/env node
/**
 * Verifies packages/bespoke-engine matches BESPOKE_UPSTREAM except for the
 * allowed import-line rewrites applied by bespoke-sync.mjs.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM =
  process.env.BESPOKE_UPSTREAM?.trim() || join(homedir(), "Bespoke");
const PKG = join(ROOT, "packages/bespoke-engine");

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

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function normalizeUpstreamSource(source, fileName) {
  let next = source;

  if (fileName === "match.ts") {
    next = next.replace(
      /import accordData from ["']@bespoke-data\/accords\.json["'];/,
      'import { loadAccords } from "./load-data.js";',
    );
    next = next.replace(
      /const ACCORDS: Accord\[\] = \(accordData as unknown as AccordLibrary\)\.accords;/,
      "const ACCORDS: Accord[] = loadAccords().accords;",
    );
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

  next = next.replace(/from ["'](\.\/[^"']+)["']/g, (_m, spec) => {
    if (spec.endsWith(".js") || spec.endsWith(".json")) return `from "${spec}"`;
    return `from "${spec}.js"`;
  });

  return next;
}

function fail(message) {
  console.error(`bespoke:verify FAILED: ${message}`);
  process.exit(1);
}

if (!existsSync(UPSTREAM)) {
  fail(`upstream not found at ${UPSTREAM}`);
}

const errors = [];

for (const name of ENGINE_FILES) {
  const upstreamPath = join(UPSTREAM, "web/lib/bespoke", name);
  const localPath = join(PKG, "src", name);
  if (!existsSync(upstreamPath)) {
    errors.push(`missing upstream ${name}`);
    continue;
  }
  if (!existsSync(localPath)) {
    errors.push(`missing local ${name}`);
    continue;
  }
  const expected = normalizeUpstreamSource(
    readFileSync(upstreamPath, "utf8"),
    name,
  );
  const actual = readFileSync(localPath, "utf8");
  if (expected !== actual) {
    errors.push(
      `${name} differs from upstream beyond allowed import rewrites`,
    );
  }
}

const manifest = JSON.parse(
  readFileSync(join(PKG, "data/checksums.json"), "utf8"),
);

for (const name of DATA_FILES) {
  const upstreamPath = join(UPSTREAM, "data", name);
  const localPath = join(PKG, "data", name);
  const upstreamHash = sha256(readFileSync(upstreamPath));
  const localHash = sha256(readFileSync(localPath));
  if (upstreamHash !== localHash) {
    errors.push(`data/${name} hash differs from upstream`);
  }
  const entry = manifest.checksums[`data/${name}`];
  if (!entry?.sha256 || entry.sha256 !== localHash) {
    errors.push(`data/${name} does not match checksums.json`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("bespoke:verify OK — engine sources + data match upstream");
