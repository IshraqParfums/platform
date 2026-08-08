/**
 * Why two materials meld — computed, not asserted.
 *
 * `pairs_with` told us *that* bergamot and clary sage go together. It could
 * not tell us why, could not be checked, and could not say anything at all
 * about a pair nobody had thought to list. This module derives the answer
 * from three sources, in descending order of how much they prove:
 *
 *   1. SHARED CONSTITUENTS. Bergamot is 28% linalyl acetate and 12% linalool.
 *      Clary sage is 62% and 18%. They are not "compatible" — they are
 *      substantially the same two molecules, and two things largely made of
 *      the same thing cannot clash. This is the strongest signal and the only
 *      one that is a fact about the materials rather than about perception.
 *
 *   2. SHARED FACETS. Cypriol's leather and Safraleine's leather are
 *      different chemistry arriving at the same percept. Weaker evidence than
 *      a shared molecule, but it is how a perfumer actually reasons, and it
 *      catches pairs that have no chemistry in common at all.
 *
 *   3. BRIDGED FACETS. Not the same facet, but two facets that reliably reach
 *      each other — smoky and leather, powdery and vanilla. Weakest, and
 *      weighted accordingly.
 *
 * SECONDARY FACETS ARE WEIGHTED, NOT IGNORED
 * ------------------------------------------
 * Two materials sharing a *primary* facet are two of the same thing; that is
 * substitution, not melding. Two materials sharing a *secondary* facet have
 * different jobs and a common thread — which is the interesting case, and the
 * one the request was actually about. So a secondary-secondary match scores
 * higher than primary-primary. This is a deliberate inversion of the obvious
 * weighting and the reason the panel finds seams a family-based view misses.
 *
 * WHAT IT REFUSES TO DO
 * ---------------------
 * A proprietary base declares no composition. Its `undisclosed_pct` is 100 and
 * it will never report a shared constituent — not "no evidence found" but
 * "cannot be evidence". Those materials fall back to facets alone, and the UI
 * says so, because a guessed molecule is indistinguishable from a real one
 * once it is in a data structure.
 */

/* ------------------------------------------------------------------ types */

export interface Constituent {
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

export interface MaterialComposition {
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

export interface FacetLexicon {
  aliases: Record<string, string>;
  canonical: Record<string, { label: string; group: string; uses: number }>;
  bridges: Record<string, Record<string, number>>;
}

export interface TechniqueNote {
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

/** The subset of AtelierMaterial this module needs. Keeps it testable. */
export interface AffinityMaterial {
  id: string;
  name: string;
  notePosition: "top" | "heart" | "base";
  facetsPrimary: string[];
  facetsSecondary: string[];
  perceptualCluster: string[];
  composition: MaterialComposition;
}

/* ------------------------------------------------------------- weighting */

/**
 * A secondary-secondary facet match is the signal we care about, so it
 * outscores a primary-primary one. See the module comment.
 */
const FACET_WEIGHT = {
  secondarySecondary: 1.0,
  primarySecondary: 0.7,
  primaryPrimary: 0.45,
  cluster: 0.5,
};

/** A bridged (not identical) facet pair is worth this fraction of a real match. */
const BRIDGE_DISCOUNT = 0.55;

/**
 * Shared mass at which the chemistry term is ~63% of the way to certain.
 * Around 11–12% shared mass is where two materials stop being neighbours and
 * start being versions of each other.
 */
const CHEMISTRY_SCALE = 12;
/** Facet weight that counts as a full facet-based match — roughly two solid links. */
const FACET_SCALE = 1.5;

/** Above this, two materials will read as one. */
export const FUSED_THRESHOLD = 0.6;
/** Below this, nothing in the data connects them. */
export const ORPHAN_THRESHOLD = 0.12;

/* --------------------------------------------------------------- lexicon */

export function canonicalFacet(lexicon: FacetLexicon, facet: string): string {
  return lexicon.aliases[facet] ?? facet;
}

function canonicalSet(lexicon: FacetLexicon, facets: string[]): Set<string> {
  return new Set(facets.map((f) => canonicalFacet(lexicon, f)));
}

export function facetLabel(lexicon: FacetLexicon, facet: string): string {
  const canon = canonicalFacet(lexicon, facet);
  return lexicon.canonical[canon]?.label ?? canon.replace(/-/g, " ");
}

/* --------------------------------------------------------- shared molecules */

export interface SharedConstituent {
  id: string;
  name: string;
  /** Percent of material A that is this molecule. */
  pctA: number;
  pctB: number;
  /** The lower of the two — how much of the *smaller* stake actually overlaps. */
  overlap: number;
  facets: string[];
}

/**
 * Molecules present in both materials.
 *
 * Ranked by the *lower* of the two percentages, not the higher: a molecule
 * that is 40% of one material and 0.5% of the other is barely a connection
 * between them, and ranking by the 40% would make it look like the strongest
 * link in the formula.
 */
export function sharedConstituents(
  a: AffinityMaterial,
  b: AffinityMaterial,
  byId: Map<string, Constituent>,
): SharedConstituent[] {
  const inB = new Map(b.composition.constituents.map((c) => [c.id, c.pct]));
  const out: SharedConstituent[] = [];
  for (const { id, pct } of a.composition.constituents) {
    const pctB = inB.get(id);
    if (pctB === undefined) continue;
    const constituent = byId.get(id);
    // Solvents and odourless carriers are shared by many materials and mean
    // nothing about how they smell together.
    if (!constituent || constituent.facets.length === 0) continue;
    out.push({
      id,
      name: constituent.name,
      pctA: pct,
      pctB,
      overlap: Math.min(pct, pctB),
      facets: constituent.facets,
    });
  }
  return out.sort((x, y) => y.overlap - x.overlap);
}

/* ------------------------------------------------------------ shared facets */

export interface SharedFacet {
  facet: string;
  /** Where it sits in each material — secondary/secondary is the good one. */
  kind: "secondary-secondary" | "primary-secondary" | "primary-primary" | "cluster";
  weight: number;
}

export interface BridgedFacet {
  facetA: string;
  facetB: string;
  weight: number;
}

export function sharedFacets(
  a: AffinityMaterial,
  b: AffinityMaterial,
  lexicon: FacetLexicon,
): SharedFacet[] {
  const aPrimary = canonicalSet(lexicon, a.facetsPrimary);
  const aSecondary = canonicalSet(lexicon, a.facetsSecondary);
  const bPrimary = canonicalSet(lexicon, b.facetsPrimary);
  const bSecondary = canonicalSet(lexicon, b.facetsSecondary);
  const aCluster = canonicalSet(lexicon, a.perceptualCluster);
  const bCluster = canonicalSet(lexicon, b.perceptualCluster);

  const out = new Map<string, SharedFacet>();
  const record = (facet: string, kind: SharedFacet["kind"], weight: number) => {
    const existing = out.get(facet);
    if (!existing || weight > existing.weight) out.set(facet, { facet, kind, weight });
  };

  for (const f of aSecondary) {
    if (bSecondary.has(f)) record(f, "secondary-secondary", FACET_WEIGHT.secondarySecondary);
    else if (bPrimary.has(f)) record(f, "primary-secondary", FACET_WEIGHT.primarySecondary);
  }
  for (const f of aPrimary) {
    if (bSecondary.has(f)) record(f, "primary-secondary", FACET_WEIGHT.primarySecondary);
    else if (bPrimary.has(f)) record(f, "primary-primary", FACET_WEIGHT.primaryPrimary);
  }
  for (const f of aCluster) {
    if (bCluster.has(f)) record(f, "cluster", FACET_WEIGHT.cluster);
  }
  return [...out.values()].sort((x, y) => y.weight - x.weight);
}

export function bridgedFacets(
  a: AffinityMaterial,
  b: AffinityMaterial,
  lexicon: FacetLexicon,
  alreadyShared: Set<string>,
): BridgedFacet[] {
  const aAll = canonicalSet(lexicon, [...a.facetsPrimary, ...a.facetsSecondary]);
  const bAll = canonicalSet(lexicon, [...b.facetsPrimary, ...b.facetsSecondary]);
  const out = new Map<string, BridgedFacet>();
  for (const fa of aAll) {
    const links = lexicon.bridges[fa];
    if (!links) continue;
    for (const [fb, weight] of Object.entries(links)) {
      if (!bAll.has(fb)) continue;
      // Skip only when both ends are already counted as direct matches. If
      // one end is shared and the other is not, this is a genuinely
      // different observation: Cypriol's smoke reaching Safraleine's leather
      // is not the same fact as both of them having leather.
      if (alreadyShared.has(fa) && alreadyShared.has(fb)) continue;
      const key = fa < fb ? `${fa}|${fb}` : `${fb}|${fa}`;
      const existing = out.get(key);
      if (!existing || weight > existing.weight) out.set(key, { facetA: fa, facetB: fb, weight });
    }
  }
  return [...out.values()].sort((x, y) => y.weight - x.weight);
}

/* ------------------------------------------------------------- the score */

export interface Affinity {
  a: string;
  b: string;
  score: number;
  /** How much of the two, by mass, is literally the same molecules. */
  chemicalOverlapPct: number;
  constituents: SharedConstituent[];
  facets: SharedFacet[];
  bridges: BridgedFacet[];
  /** True when at least one side declares no composition. */
  chemistryUnavailable: boolean;
  /** Both materials list each other in the palette's hand-authored pairs_with. */
  handAuthored: boolean;
}

/**
 * 0 to ~1. Not a probability — a ranking, so the panel can say which seam in
 * a formula is the weakest.
 *
 * Chemistry uses a saturating exponential rather than a linear ramp because
 * the relationship is not linear: going from 1% to 11% shared mass changes
 * everything about whether two materials fuse, and going from 40% to 65%
 * changes almost nothing — they were already the same thing at 40%. It also
 * carries the largest weight, because it is the only term that is a fact
 * about the materials rather than a judgement about perception.
 */
export function affinity(
  a: AffinityMaterial,
  b: AffinityMaterial,
  lexicon: FacetLexicon,
  constituentsById: Map<string, Constituent>,
  pairsWith: Map<string, Set<string>>,
): Affinity {
  const constituents = sharedConstituents(a, b, constituentsById);
  const facets = sharedFacets(a, b, lexicon);
  const shared = new Set(facets.map((f) => f.facet));
  const bridges = bridgedFacets(a, b, lexicon, shared);

  const chemicalOverlapPct = constituents.reduce((sum, c) => sum + c.overlap, 0);
  const chemistryScore = 1 - Math.exp(-chemicalOverlapPct / CHEMISTRY_SCALE);

  const facetScore = Math.min(facets.reduce((sum, f) => sum + f.weight, 0) / FACET_SCALE, 1);
  const bridgeScore = Math.min(
    bridges.reduce((sum, x) => sum + x.weight * BRIDGE_DISCOUNT, 0) / FACET_SCALE,
    1,
  );

  const handAuthored =
    (pairsWith.get(a.id)?.has(b.id) ?? false) || (pairsWith.get(b.id)?.has(a.id) ?? false);

  const score = Math.min(
    1,
    chemistryScore * 0.62 + facetScore * 0.24 + bridgeScore * 0.12 + (handAuthored ? 0.08 : 0),
  );

  return {
    a: a.id,
    b: b.id,
    score,
    chemicalOverlapPct,
    constituents,
    facets,
    bridges,
    chemistryUnavailable:
      a.composition.constituents.length === 0 || b.composition.constituents.length === 0,
    handAuthored,
  };
}

/* ------------------------------------------------- the formula as a graph */

export interface CohesionReport {
  edges: Affinity[];
  /** Groups of materials connected to each other above ORPHAN_THRESHOLD. */
  clusters: string[][];
  /** In the formula but connected to nothing — the seam. */
  orphans: string[];
  /** Pairs so alike they will not read as two materials. */
  fused: Affinity[];
  /** Mean edge score. Low means a formula of strangers. */
  cohesion: number;
}

export function analyseCohesion(
  materials: AffinityMaterial[],
  lexicon: FacetLexicon,
  constituentsById: Map<string, Constituent>,
  pairsWith: Map<string, Set<string>>,
): CohesionReport {
  const edges: Affinity[] = [];
  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      edges.push(affinity(materials[i], materials[j], lexicon, constituentsById, pairsWith));
    }
  }
  edges.sort((x, y) => y.score - x.score);

  // Union-find over edges above the orphan threshold.
  const parent = new Map(materials.map((m) => [m.id, m.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let walk = id;
    while (parent.get(walk) !== walk) {
      const next = parent.get(walk)!;
      parent.set(walk, root);
      walk = next;
    }
    return root;
  };
  const union = (x: string, y: string) => {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  };
  const connected = new Set<string>();
  for (const edge of edges) {
    if (edge.score < ORPHAN_THRESHOLD) continue;
    union(edge.a, edge.b);
    connected.add(edge.a);
    connected.add(edge.b);
  }

  const groups = new Map<string, string[]>();
  for (const m of materials) {
    if (!connected.has(m.id)) continue;
    const root = find(m.id);
    const list = groups.get(root);
    if (list) list.push(m.id);
    else groups.set(root, [m.id]);
  }

  return {
    edges,
    clusters: [...groups.values()].sort((x, y) => y.length - x.length),
    orphans: materials.filter((m) => !connected.has(m.id)).map((m) => m.id),
    fused: edges.filter((e) => e.score >= FUSED_THRESHOLD),
    cohesion: edges.length ? edges.reduce((s, e) => s + e.score, 0) / edges.length : 0,
  };
}

/* --------------------------------------------------- bridge suggestions */

export interface BridgeSuggestion {
  material: AffinityMaterial;
  /** What it would connect. */
  connects: [string, string];
  /** Its weaker affinity to the two sides — a bridge is only as good as that. */
  strength: number;
  reason: string;
}

/**
 * Materials not in the formula that would connect two things currently
 * disconnected from each other.
 *
 * Scored on the *weaker* of the two new links. A candidate that is a perfect
 * match for one side and unrelated to the other is not a bridge, however
 * good that one link looks.
 */
export function suggestBridges(
  formula: AffinityMaterial[],
  palette: AffinityMaterial[],
  report: CohesionReport,
  lexicon: FacetLexicon,
  constituentsById: Map<string, Constituent>,
  pairsWith: Map<string, Set<string>>,
  limit = 4,
): BridgeSuggestion[] {
  const inFormula = new Set(formula.map((m) => m.id));
  const byId = new Map(formula.map((m) => [m.id, m]));

  // The gaps worth closing: every orphan against the largest cluster, plus
  // cluster-to-cluster if the formula has split in two.
  const gaps: [string, string][] = [];
  const main = report.clusters[0] ?? [];
  for (const orphan of report.orphans) {
    for (const other of main.slice(0, 3)) gaps.push([orphan, other]);
    // An orphan with nothing else at all still needs a partner.
    if (main.length === 0) {
      for (const other of report.orphans) if (other !== orphan) gaps.push([orphan, other]);
    }
  }
  for (let i = 1; i < report.clusters.length; i++) {
    const from = report.clusters[i][0];
    for (const other of main.slice(0, 2)) gaps.push([from, other]);
  }
  if (gaps.length === 0) return [];

  const scored: BridgeSuggestion[] = [];
  for (const candidate of palette) {
    if (inFormula.has(candidate.id)) continue;
    let best: BridgeSuggestion | null = null;
    for (const [x, y] of gaps) {
      const mx = byId.get(x);
      const my = byId.get(y);
      if (!mx || !my) continue;
      const ax = affinity(candidate, mx, lexicon, constituentsById, pairsWith);
      const ay = affinity(candidate, my, lexicon, constituentsById, pairsWith);
      const strength = Math.min(ax.score, ay.score);
      if (strength < ORPHAN_THRESHOLD) continue;
      if (best && strength <= best.strength) continue;
      best = {
        material: candidate,
        connects: [x, y],
        strength,
        reason: describeBridge(candidate, mx, my, ax, ay, lexicon),
      };
    }
    if (best) scored.push(best);
  }

  return scored.sort((a, b) => b.strength - a.strength).slice(0, limit);
}

function describeBridge(
  candidate: AffinityMaterial,
  x: AffinityMaterial,
  y: AffinityMaterial,
  ax: Affinity,
  ay: Affinity,
  lexicon: FacetLexicon,
): string {
  const side = (target: AffinityMaterial, link: Affinity): string => {
    if (link.constituents.length > 0) {
      const top = link.constituents[0];
      return `shares ${top.name.toLowerCase()} with ${target.name}`;
    }
    if (link.facets.length > 0) {
      return `meets ${target.name} on ${facetLabel(lexicon, link.facets[0].facet)}`;
    }
    if (link.bridges.length > 0) {
      const b = link.bridges[0];
      return `${facetLabel(lexicon, b.facetA)} reaches ${target.name}'s ${facetLabel(lexicon, b.facetB)}`;
    }
    return `connects to ${target.name}`;
  };
  return `${candidate.name} ${side(x, ax)}, and ${side(y, ay)}.`;
}

/* ------------------------------------------------- constituent roll-up */

export interface ConstituentTotal {
  constituent: Constituent;
  /** Percent of the finished compound that is this molecule, from all sources. */
  pct: number;
  /** Which materials contribute it, and how much each. */
  sources: { materialId: string; materialName: string; pct: number }[];
}

/**
 * What the formula is made of at the molecule level.
 *
 * This is the number no per-material field can show. A formula can carry six
 * materials none of which look like a linalool problem and still be 8%
 * linalool, because the linalool is spread across all six. The EU declarable
 * threshold is on the finished product's total, not on any one ingredient.
 */
export function rollUpConstituents(
  rows: { materialId: string; neatPct: number }[],
  byId: Map<string, AffinityMaterial>,
  constituentsById: Map<string, Constituent>,
): { totals: ConstituentTotal[]; undisclosedPct: number } {
  const acc = new Map<string, ConstituentTotal>();
  let undisclosedPct = 0;

  for (const row of rows) {
    const material = byId.get(row.materialId);
    if (!material) continue;
    const share = row.neatPct / 100;
    undisclosedPct += material.composition.undisclosed_pct * share;

    for (const { id, pct } of material.composition.constituents) {
      const constituent = constituentsById.get(id);
      if (!constituent) continue;
      const contribution = pct * share;
      const existing = acc.get(id);
      if (existing) {
        existing.pct += contribution;
        existing.sources.push({
          materialId: material.id,
          materialName: material.name,
          pct: contribution,
        });
      } else {
        acc.set(id, {
          constituent,
          pct: contribution,
          sources: [{ materialId: material.id, materialName: material.name, pct: contribution }],
        });
      }
    }
  }

  for (const total of acc.values()) {
    total.sources.sort((a, b) => b.pct - a.pct);
  }
  return {
    totals: [...acc.values()].sort((a, b) => b.pct - a.pct),
    undisclosedPct,
  };
}

/* ------------------------------------------------------- technique notes */

export interface FiredNote {
  note: TechniqueNote;
  /** suggestion: something to add. satisfied: already done. guidance: just read it. */
  kind: "suggestion" | "satisfied" | "guidance" | "comparison";
  /** Suggested materials not yet in the formula. */
  missing: string[];
  /** Formula materials that made this note fire. */
  matched: string[];
  /** How specifically this note is about *this* formula. Higher is tighter. */
  relevance: number;
}

/**
 * How much a fired note is actually about the formula in front of you.
 *
 * Without this, a four-material formula fires twenty-three notes and the
 * perfumer learns to ignore the panel — which is worse than not having it.
 * The distinguishing question is how *specific* the trigger was:
 *
 *   A bridging note needing a citrus AND a floral has observed a real
 *   situation. A note needing only "any citrus" has observed that you own
 *   bergamot. Both are true; only the first is worth interrupting for.
 */
function relevanceOf(note: TechniqueNote, matched: string[]): number {
  let score = 0;
  // Each satisfied group is an independent condition that happened to hold.
  score += note.requires_any.length * 2.5;
  score += note.requires_all.length * 2.5;
  // A note that named several of your materials is about your formula.
  score += Math.min(matched.length, 4) * 0.6;
  // A recipe you are halfway through beats one you have barely started.
  if (note.recipe.length > 0) {
    const present = note.recipe.filter((r) => matched.includes(r.material)).length;
    score += (present / note.recipe.length) * 3;
  }
  // Advice we cannot act on, because the material is not in the palette.
  if (note.suggests.length === 0 && note.recipe.length === 0 && note.off_palette.length > 0) {
    score -= 2;
  }
  return score;
}

/**
 * Which bench notes apply to the formula as it stands right now.
 *
 * A note with no requirements is general advice — it is returned as guidance
 * only when explicitly asked for, never pushed, or every formula would open
 * with the same fifteen tips and the user would learn to ignore all of them.
 */
export function fireNotes(
  notes: TechniqueNote[],
  formulaIds: Set<string>,
  { includeUniversal = false }: { includeUniversal?: boolean } = {},
): FiredNote[] {
  const out: FiredNote[] = [];

  for (const note of notes) {
    const hasRequirements = note.requires_all.length > 0 || note.requires_any.length > 0;

    if (hasRequirements) {
      if (!note.requires_all.every((id) => formulaIds.has(id))) continue;
      if (!note.requires_any.every((group) => group.some((id) => formulaIds.has(id)))) continue;
    } else if (note.compare.length > 0) {
      // A this-or-that note is only interesting once one of the two is in play.
      if (!note.compare.some((id) => formulaIds.has(id))) continue;
    } else if (note.recipe.length > 0) {
      // A recipe surfaces once the formula has started down that road.
      const present = note.recipe.filter((r) => formulaIds.has(r.material)).length;
      if (present === 0 || present === note.recipe.length) continue;
    } else if (!includeUniversal) {
      continue;
    }

    const matched = note.involves.filter((id) => formulaIds.has(id));
    const wanted = note.suggests.length > 0
      ? note.suggests
      : note.recipe.map((r) => r.material);
    const missing = wanted.filter((id) => !formulaIds.has(id));

    let kind: FiredNote["kind"];
    if (note.compare.length > 0) kind = "comparison";
    else if (wanted.length === 0) kind = "guidance";
    else if (missing.length === 0) kind = "satisfied";
    else kind = "suggestion";

    out.push({ note, kind, missing, matched, relevance: relevanceOf(note, matched) });
  }

  // Suggestions first, then the notes that confirm what is already right.
  const rank = { suggestion: 0, comparison: 1, guidance: 2, satisfied: 3 };
  return out.sort(
    (a, b) => rank[a.kind] - rank[b.kind] || b.relevance - a.relevance,
  );
}
