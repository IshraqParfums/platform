/**
 * Builds the standalone, double-clickable demo.
 *
 * The slider core in web/components/perfume-slider/core is the single source of
 * truth. This script inlines those ES modules plus the stylesheet into one HTML
 * file so the slider can be opened straight from the filesystem — no server, no
 * build tooling, nothing to install.
 *
 *   node slider/build.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const core = join(here, "..", "web", "components", "perfume-slider", "core");
const out = join(here, "perfume-slider.html");

/** Load order matters: dependencies first. */
const MODULES = ["perfume-data.js", "bottle.js", "spray.js", "slider.js"];

/**
 * Strip ES module syntax so the files can be concatenated into one script.
 * The core only uses single-line imports and simple named exports, which keeps
 * this honest — if that ever changes, this build will need a real bundler.
 */
function flatten(source, file) {
  const lines = source.split("\n");
  const kept = [];

  for (const line of lines) {
    if (/^\s*import\s.*?from\s+["'][^"']+["'];\s*$/.test(line)) continue;
    if (/^\s*export\s+default\s+\w+;\s*$/.test(line)) continue;
    if (/^\s*export\s*\{[^}]*\}\s*(from\s*["'][^"']+["'])?;\s*$/.test(line)) continue;

    if (/^\s*import\s/.test(line) || /^\s*export\s+default\s/.test(line)) {
      throw new Error(`${file}: unsupported module syntax for the inline build:\n  ${line.trim()}`);
    }

    kept.push(line.replace(/^(\s*)export\s+(const|let|function|class|async)\s/, "$1$2 "));
  }

  return kept.join("\n").trim();
}

/**
 * Wrap a module body in its own scope and lift its exports out, so private
 * helpers that happen to share a name across modules (`esc`, `clamp`) don't
 * collide once everything lives in one script.
 */
function moduleChunk(source, file) {
  const names = [];
  const re = /^\s*export\s+(?:const|let|function|class|async\s+function)\s+([A-Za-z_$][\w$]*)/gm;
  let match;
  while ((match = re.exec(source)) !== null) names.push(match[1]);

  const body = flatten(source, file);
  if (names.length === 0) return body;

  const list = names.join(", ");
  return `const { ${list} } = (() => {\n${body}\n\nreturn { ${list} };\n})();`;
}

const css = await readFile(join(core, "slider.css"), "utf8");

const scripts = [];
for (const file of MODULES) {
  const source = await readFile(join(core, file), "utf8");
  scripts.push(`/* ===== ${file} ===== */\n${moduleChunk(source, file)}`);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Collection · Ishraq Parfums</title>
<meta name="description" content="Slide through the collection — every bottle sprays as it arrives.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
/* ---- page shell (demo only — the slider itself is self-contained) ---- */
*{box-sizing:border-box;}
html,body{margin:0;padding:0;height:100%;}
body{background:#241510;}
#collection{min-height:100vh;}

/* ---- slider ---- */
${css.trim()}
</style>
</head>
<body>

<div id="collection"></div>

<script type="module">
${scripts.join("\n\n")}

/* ===== mount ===== */
const slider = createPerfumeSlider(document.getElementById("collection"), {
  perfumes: PERFUMES,
  index: 0,
  onSelect(perfume) {
    // Integration point — in the Next app this navigates to the product page.
    console.log("selected", perfume.id, perfume.name);
  },
});

// Handy while tuning: window.slider.spray(), .next(), .goTo(3)
window.slider = slider;
</script>

</body>
</html>
`;

await writeFile(out, html, "utf8");
console.log(`built ${out} (${(html.length / 1024).toFixed(1)} kB)`);
