#!/usr/bin/env node
/**
 * Custom resolver: maps @bespoke-data/* → $BESPOKE_UPSTREAM/data/*
 * Used only by the parity harness when loading upstream sources.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const UPSTREAM =
  process.env.BESPOKE_UPSTREAM?.trim() || join(homedir(), "Bespoke");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@bespoke-data/")) {
    const file = specifier.slice("@bespoke-data/".length);
    return {
      shortCircuit: true,
      url: pathToFileURL(join(UPSTREAM, "data", file)).href,
    };
  }
  return nextResolve(specifier, context);
}
