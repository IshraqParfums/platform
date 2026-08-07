#!/usr/bin/env node
/**
 * Phase 1 GATE: 2000 seeded walks — our port vs compiled upstream sources.
 *
 * 1. bespoke:verify already enforces source identity (allowed import rewrites only).
 * 2. This harness copies upstream engine files, rewrites match.ts to load accords
 *    from $BESPOKE_UPSTREAM/data, compiles them with tsc, and walks both engines
 *    with the same seeds.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir, homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM =
  process.env.BESPOKE_UPSTREAM?.trim() || join(homedir(), "Bespoke");
const SEEDS = Number(process.env.BESPOKE_PARITY_SEEDS ?? 2000);
const PKG = join(ROOT, "packages/bespoke-engine");
const TSC = join(PKG, "node_modules/.bin/tsc");

const ENGINE_FILES = [
  "types.ts",
  "similarity.ts",
  "graph.ts",
  "engine.ts",
  "copy.ts",
  "family-colors.ts",
  "match.ts",
];

function rewriteImports(source, fileName) {
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

function writeUpstreamMirror(srcDir) {
  mkdirSync(srcDir, { recursive: true });
  for (const name of ENGINE_FILES) {
    const raw = readFileSync(join(UPSTREAM, "web/lib/bespoke", name), "utf8");
    writeFileSync(join(srcDir, name), rewriteImports(raw, name));
  }
  writeFileSync(
    join(srcDir, "load-data.ts"),
    `import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AccordLibrary, QuestionGraph } from "./types.js";

const DATA_DIR = ${JSON.stringify(join(UPSTREAM, "data"))};

export function loadQuestions(): QuestionGraph {
  return JSON.parse(readFileSync(join(DATA_DIR, "questions.json"), "utf8")) as QuestionGraph;
}
export function loadAccords(): AccordLibrary {
  return JSON.parse(readFileSync(join(DATA_DIR, "accords.json"), "utf8")) as AccordLibrary;
}
`,
  );
}

async function main() {
  if (!existsSync(UPSTREAM)) throw new Error(`upstream not found: ${UPSTREAM}`);
  if (!existsSync(TSC)) throw new Error(`tsc not found at ${TSC}`);

  const work = join(PKG, ".parity-work");
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const srcDir = join(work, "src");
  const distDir = join(work, "dist");

  try {
    writeUpstreamMirror(srcDir);
    // Reuse the package's @types/node via a tiny tsconfig that extends nothing but
    // lives inside the package so node resolution finds local types.
    writeFileSync(
      join(srcDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            skipLibCheck: true,
            rootDir: ".",
            outDir: "../dist",
            typeRoots: [join(PKG, "node_modules/@types")],
          },
          include: ["./**/*.ts"],
        },
        null,
        2,
      ),
    );

    const compile = spawnSync(TSC, ["-p", join(srcDir, "tsconfig.json")], {
      encoding: "utf8",
      cwd: PKG,
    });
    if (compile.status !== 0) {
      console.error(compile.stdout);
      console.error(compile.stderr);
      console.error(compile.error);
      throw new Error("failed to compile upstream mirror");
    }
    if (!existsSync(join(distDir, "engine.js"))) {
      console.error("tsc stdout:", compile.stdout);
      console.error("tsc stderr:", compile.stderr);
      throw new Error(`upstream mirror dist missing at ${distDir}`);
    }

    const ours = await import(pathToFileURL(join(PKG, "src/index.ts")).href);
    const { runWalk, summarize } = await import(
      pathToFileURL(join(PKG, "src/parity/walk.ts")).href
    );

    const upstreamEngine = await import(
      pathToFileURL(join(distDir, "engine.js")).href
    );
    const upstreamGraph = await import(
      pathToFileURL(join(distDir, "graph.js")).href
    );
    const upstreamMatch = await import(
      pathToFileURL(join(distDir, "match.js")).href
    );
    const upstreamTypes = await import(
      pathToFileURL(join(distDir, "types.js")).href
    );
    const upstreamData = await import(
      pathToFileURL(join(distDir, "load-data.js")).href
    );

    ours.assertBespokeDataIntegrity();
    const graph = ours.loadQuestions();
    const upstreamGraphData = upstreamData.loadQuestions();

    const oursAccords = readFileSync(join(PKG, "data/accords.json"));
    const upAccords = readFileSync(join(UPSTREAM, "data/accords.json"));
    if (
      createHash("sha256").update(oursAccords).digest("hex") !==
      createHash("sha256").update(upAccords).digest("hex")
    ) {
      throw new Error("accords.json hash differs from upstream before parity");
    }

    const ourEngines = {
      applyAnswer: ours.applyAnswer,
      getNode: ours.getNode,
      isAct3Render: ours.isAct3Render,
      matchFingerprint: ours.matchFingerprint,
      matchExpertShortlist: ours.matchExpertShortlist,
      matchExpertFinal: ours.matchExpertFinal,
      initialState: ours.initialEngineState,
    };

    const upstreamEngines = {
      applyAnswer: upstreamEngine.applyAnswer,
      getNode: upstreamGraph.getNode,
      isAct3Render: upstreamGraph.isAct3Render,
      matchFingerprint: upstreamMatch.matchFingerprint,
      matchExpertShortlist: upstreamMatch.matchExpertShortlist,
      matchExpertFinal: upstreamMatch.matchExpertFinal,
      initialState: upstreamTypes.initialEngineState,
    };

    let failures = 0;
    const t0 = Date.now();

    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = runWalk(graph, seed, ourEngines);
      const b = runWalk(upstreamGraphData, seed, upstreamEngines);
      if (summarize(a) !== summarize(b)) {
        failures += 1;
        console.error(`parity mismatch at seed ${seed}`);
        console.error(" ours:", summarize(a).slice(0, 600));
        console.error(" upst:", summarize(b).slice(0, 600));
        if (failures >= 5) break;
      }
      if (seed % 200 === 0) process.stdout.write(`  … ${seed}/${SEEDS}\n`);
    }

    const ms = Date.now() - t0;
    if (failures > 0) {
      console.error(
        `bespoke:parity FAILED — ${failures} mismatch(es) in ${ms}ms`,
      );
      process.exit(1);
    }
    console.log(
      `bespoke:parity OK — ${SEEDS} seeds identical to upstream (${ms}ms)`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
