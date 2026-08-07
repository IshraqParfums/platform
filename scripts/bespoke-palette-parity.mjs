#!/usr/bin/env node
/** Assert shared palette mirror === engine FAMILY_PALETTE. */
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const engine = await import(
  pathToFileURL(join(ROOT, "packages/bespoke-engine/src/index.ts")).href
);
const shared = await import(
  pathToFileURL(join(ROOT, "packages/shared/src/bespoke/palette.ts")).href
);

assert.deepEqual([...shared.BESPOKE_DIMENSIONS], [...engine.DIMENSIONS]);
assert.deepEqual(shared.BESPOKE_FAMILY_PALETTE, engine.FAMILY_PALETTE);
console.log("bespoke:palette-parity OK");
