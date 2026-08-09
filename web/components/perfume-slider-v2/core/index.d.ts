export type BottleShape =
  | "flacon"
  | "orb"
  | "obelisk"
  | "cylinder"
  | "faceted"
  | "flask"
  | "teardrop";

export type CapTexture = "knurl" | "grain" | "facets" | "none";

export interface PerfumeTheme {
  /** Primary accent — mist colour, glow, UI highlights. */
  accent: string;
  /** Lighter accent for fine detail and type. */
  accentSoft: string;
  /** Ambient stage wash behind the bottle. */
  aura: string;
  shape: BottleShape;
  /** Translucent glass tint. */
  glass: string;
  /** Liquid gradient: top, middle, bottom. */
  juice: [string, string, string];
  /**
   * The colour each tier brings to mind, top to base — read off the materials
   * in it rather than off the liquid. Saffron and jasmine are a deep orange
   * whatever the oil in the bottle looks like, and `juice` is a picture of the
   * oil. Optional: without it the tiers fall back to the juice gradient, which
   * has to be pulled apart to stay legible.
   */
  scent?: [string, string, string];
  /** Liquid level as a fraction of the body height, 0–1. */
  fill: number;
  cap: {
    c1: string;
    c2: string;
    c3: string;
    texture: CapTexture;
    w: number;
    h: number;
    r: number;
  };
  collar: { c1: string; c2: string };
  label: { style: "foil" | "etched" | "plate"; ink: string; plate: string };
}

/**
 * How the perfume is put on.
 *
 * Mukhallats and attars are oils and are never sprayed — they come with a
 * glass rod fixed to the cap, drawn out and touched once to the skin. The
 * slider renders a different closure and a different gesture for each.
 */
export type Application = "spray" | "rod";

/** The three tiers of the fragrance pyramid, in the order they leave. */
export type NoteTier = "top" | "heart" | "base";

/** One material in the perfumer's palette, described once for the whole house. */
export interface Material {
  /** What it actually is. A buyer reading "Iso E Super" deserves to know. */
  kind: "natural" | "molecule" | "resin" | "animalic" | "accord";
  family: string;
  blurb: string;
}

export interface PerfumeSize {
  ml: number;
  price: string;
  label: string;
  note?: string;
  /** Marks the size to lead with. */
  best?: boolean;
}

/**
 * Everything the collection view has no room for.
 *
 * Optional, so a catalogue that has not been filled in yet still renders — the
 * discover page degrades section by section rather than failing.
 */
export interface PerfumeDetail {
  family: string;
  perfumer: string;
  year: number;
  story: string;
  /** Hours on skin, low to high, plus a word for it. */
  longevity: { hours: [number, number]; label: string };
  /** How far it carries. 1 skin, 4 fills a room. */
  sillage: { level: 1 | 2 | 3 | 4; label: string };
  occasions: string[];
  seasons: string[];
  /** How to put it on, in a sentence. */
  wear: string;
  /** "If you like…" — the most-searched thing in fragrance. */
  similarTo: string[];
  sizes: PerfumeSize[];
  /** What the concentration on the bottle actually means. */
  concentrationNote: string;
}

/**
 * Where a perfume sits on the ten axes the bespoke question graph scores
 * against. The quiz accumulates the same ten from a customer's answers, so a
 * catalogue that carries these can be ranked against a fingerprint rather than
 * only being able to blend something new.
 */
export type ScentProfile = Record<
  | "floral"
  | "woody"
  | "spicy"
  | "green"
  | "aldehydic"
  | "gourmand"
  | "animalic"
  | "earthy"
  | "citrus"
  | "musky",
  number
>;

export interface Perfume {
  id: string;
  name: string;
  collection: string;
  application: Application;
  concentration: string;
  size: string;
  price: string;
  tagline: string;
  notes: Record<NoteTier, string[]>;
  detail?: PerfumeDetail;
  theme: PerfumeTheme;
  profile?: ScentProfile;
  /**
   * The bespoke accord (data/accords.json) that this retail perfume's real,
   * dosed formula actually is — the one an admin can open to see ingredient
   * quantities, dilutions and IFRA flags. Optional: catalogue entries whose
   * `notes` are still flavour text rather than a real formula have no accord
   * to point to, and the admin perfume view says so rather than guessing.
   */
  accordId?: string;
}

export interface PerfumeSliderOptions {
  /** The collection to show. Required — the core ships no data of its own. */
  perfumes: Perfume[];
  /** Starting slide. Default 0. */
  index?: number;
  /**
   * Which way the bottle points. Default 0 — at the viewer, so a spray lands
   * on the glass in front of you rather than off to the side.
   */
  facing?: Facing;
  /** Fire once on arrival. Default false. */
  sprayOnLoad?: boolean;
  /**
   * Fire when the active perfume changes. Default false: nothing sprays
   * unless somebody asks it to.
   */
  sprayOnChange?: boolean;
  /**
   * Small puff as each bottle passes the front while being dragged. Default
   * true — this one answers a gesture rather than happening on its own.
   */
  sprayOnSlide?: boolean;
  /** Advance on a timer. Default false. */
  autoplay?: boolean;
  /** Milliseconds between advances. Default 5200. */
  autoplayDelay?: number;
  onChange?: (perfume: Perfume, index: number) => void;
  onSpray?: (perfume: Perfume, index: number) => void;
  /** Fired by the "Discover" call to action. */
  onSelect?: (perfume: Perfume, index: number) => void;
}

/** Which way the atomiser points: -1 left, 0 toward the viewer, 1 right. */
export type Facing = -1 | 0 | 1;

export interface PerfumeSliderInstance {
  readonly index: number;
  readonly perfume: Perfume;
  readonly facing: Facing;
  /** Turn the bottle. Facing the viewer lands the mist on the screen. */
  setFacing(facing: Facing, spraying?: boolean): void;
  goTo(index: number): void;
  next(): void;
  prev(): void;
  spray(power?: number): void;
  /**
   * How far the liquid on the glass has been carried from centre, in pixels,
   * as the table turns under it. Read-only.
   */
  readonly glassAnchor: number;
  /** Swap the collection at runtime — e.g. once the API responds. */
  setPerfumes(list: Perfume[], keepIndex?: boolean): void;
  destroy(): void;
}

export declare function createPerfumeSlider(
  root: HTMLElement,
  options: PerfumeSliderOptions,
): PerfumeSliderInstance;

/* ------------------------------------------------------------- drydown model
   How a perfume comes apart over time, with no opinion about how it is drawn.
   Shared by every surface that shows a pyramid.                             */

/** Stacking order, bottom to top: a pyramid is built from its foundation. */
export declare const TIERS: NoteTier[];
/** Share of the perfume's life each tier survives. */
export declare const SHARE: Record<NoteTier, number>;
/** How long a full drydown takes on screen, in ms. */
export declare const RUN_MS: number;
/**
 * A beat at the very start where nothing has moved yet, so the opening chord —
 * all three tiers up at once — is on screen long enough to read.
 */
export declare const OPENING_HOLD_MS: number;
export declare const TIER_LABEL: Record<NoteTier, string>;
/** What each tier is called on a timeline, where it is a stretch of the wear. */
export declare const TIER_PHASE: Record<NoteTier, string>;
/**
 * Written from what a perfume gives you, not what it loses — the physics is a
 * decay curve, but decay is the wrong story for somebody deciding what to buy.
 */
export declare const TIER_BLURB: Record<NoteTier, string>;
/** What a tier did, once its stretch is done. */
export declare const TIER_HANDOVER: Record<NoteTier, string>;
/** A word for how long this lasts, from the perspective of wearing it. */
export declare function enduranceLabel(totalHours: number): string;
/** Hours a tier holds on skin, for a perfume lasting `totalHours`. */
export declare function tierHours(tier: NoteTier, totalHours: number): number;
/** How loud each tier is in the opening. Everything is on the skin at once. */
export declare const AMPLITUDE: Record<NoteTier, number>;
/**
 * How much of a tier is still on the skin. Exponential decay running from the
 * first moment for all three — nothing waits its turn and nothing switches off.
 */
export declare function tierPresence(tier: NoteTier, t: number): number;
/**
 * What you are actually smelling right now, as a share per tier summing to 1.
 *
 * Not the same as how much is left. A base note barely changes over the first
 * hour but its share climbs steeply, because the top is collapsing next to it.
 */
export declare function tierMix(t: number): Record<NoteTier, number>;
/** Whether a tier is coming forward — its share of the smell still climbing. */
export declare function tierRising(tier: NoteTier, t: number, dt?: number): boolean;
/** Where a tier has got to, `t` being 0–1 through the run. */
export declare function tierState(
  tier: NoteTier,
  t: number,
): { gone: number; left: number; spent: boolean };
/** Hours as something readable: minutes under the hour, hours above it. */
export declare function formatHours(hours: number): string;
/**
 * Elapsed time as a labelled duration — 48m, 2h 48m, 9h. Not 2:48: a colon
 * reads as the time of day, and this is a duration.
 */
export declare function formatClock(hours: number): string;
/**
 * The same split into parts, for setting the numbers and their units in
 * different type — the only way to keep a big readout scannable while still
 * saying what the numbers are.
 */
export declare function clockParts(hours: number): { h: number; m: number };
/** Where each tier gives out, in the order they leave, for marking a timeline. */
export declare function milestones(
  totalHours: number,
): { tier: NoteTier; at: number; hours: number }[];
/**
 * Roughly how long a class of material hangs on, relative to the others. A
 * proxy — volatility belongs to a molecule, not a category — used only to order
 * the materials within a tier.
 */
export declare const KIND_HOLD: Record<string, number>;
/**
 * How much of each material in a tier is still on the skin, given how far
 * through that tier's fade it is. A tier does not leave all at once: the
 * lightest thing in it goes first and the heaviest finishes last, with the
 * windows overlapping so the tier thins as a wave.
 */
export declare function noteFade(kinds: string[], gone: number): number[];
/** Which stop of the bottle's juice gradient each tier is pigmented from. */
export declare const TIER_TONE: Record<NoteTier, number>;
/**
 * The pigment for one tier, taken from the perfume's own liquid.
 *
 * Hue comes from the bottle and is left alone — that is what makes a rose
 * attar's layers pink and a cologne's yellow-green. Only lightness and a floor
 * under saturation are imposed, so every layer reads on a dark ground and the
 * three of them are never the same colour.
 */
export declare function tierColor(theme: PerfumeTheme, tier: NoteTier): string;
/**
 * The same pigment, lightened until it can be read as type. The base's pigment
 * is a deep one, and deep on top of deep is not a label.
 */
export declare function tierInk(theme: PerfumeTheme, tier: NoteTier): string;
/** The longevity a perfume claims, with a fallback. */
export declare function totalHoursOf(perfume: Perfume): number;

export declare function renderBottle(perfume: Perfume, uid: string): string;

/**
 * The bottle's label, as HTML rather than SVG.
 *
 * Deliberately not <text> inside the SVG: Chromium keeps a stale raster of SVG
 * glyphs after the element is transformed, so the plate would repaint and the
 * lettering would not. Position and type size are percentages of the bottle
 * box, so it tracks the glass at any scale. Render it as a sibling of the SVG.
 */
export declare function renderLabel(perfume: Perfume): string;

/** A note with its volatility, which is what decides how long it survives. */
export interface VolatileNote {
  name: string;
  persistence: number;
}

/** Atomised spray landing on the glass, coalescing and drying. */
export declare class Droplets {
  drops: object[];
  residues: object[];
  isEmpty(): boolean;
  hasLiquid(): boolean;
  isWetAt(x: number, y: number, reach?: number): boolean;
  clear(): void;
}

/** A viscous film drawn on with a glass rod. It does not bead, and it stays. */
export declare class Oil {
  begin(o: { color: string; colorSoft?: string; width?: number }): void;
  to(x: number, y: number): void;
  end(): void;
  isEmpty(): boolean;
  hasLiquid(): boolean;
  isWetAt(x: number, y: number, reach?: number): boolean;
  clear(): void;
}

/** A hand dragged across, gathering liquid into a bead and shedding it. */
export declare class Wipe {
  at(x: number, y: number, droplets: Droplets, oil: Oil): void;
  end(): void;
  isEmpty(): boolean;
  clear(): void;
}

/**
 * The pane between the viewer and the bottle. Owns the canvas and the frame
 * loop; composes the droplets, the oil and the wipe, which are independent.
 */
export declare class GlassSurface {
  constructor(canvas: HTMLCanvasElement);
  readonly droplets: Droplets;
  readonly oil: Oil;
  readonly wiper: Wipe;
  /** Called when the glass becomes wet or finishes drying. */
  onWetChange: ((wet: boolean) => void) | null;
  /** Which perfume put the current liquid here. */
  owner: number;
  /** Where that perfume's bottle is now, so the liquid can travel with it. */
  readonly anchor: number;
  setAnchor(x: number): void;
  resize(): void;
  /** Fire the atomiser at the viewer. */
  spray(o: {
    /** Which perfume is firing; the liquid then travels with its bottle. */
    owner?: number;
    x: number;
    y: number;
    color: string;
    colorSoft?: string;
    power?: number;
    /**
     * Liquid nobody asked for — the puff a bottle gives off as it turns past
     * the front. Drawn like any other, but ignored by `isWetAt`, so it cannot
     * turn the next drag into a wipe.
     */
    passive?: boolean;
    /** Ingredients to pin to landing droplets. */
    notes?: VolatileNote[];
    /** Called as those droplets land; the caller owns the text. */
    onLabel?: (note: string, x: number, y: number, r: number, ms: number) => void;
  }): void;
  oilBegin(o: { owner?: number; color: string; colorSoft?: string; width?: number }): void;
  oilTo(x: number, y: number): void;
  oilEnd(): void;
  wipe(x: number, y: number): void;
  endWipe(): void;
  hasLiquid(): boolean;
  isWetAt(x: number, y: number, reach?: number): boolean;
  start(): void;
  stop(): void;
  clear(): void;
  destroy(): void;
}

/**
 * Sparkles, for the moment a perfume finishes its wear. Not the spray engine
 * with a different colour: mist is a drifting cloud, a sparkle is a hard glint
 * that flares and snaps out, and neither makes a good version of the other.
 */
export declare class Sparkles {
  constructor(canvas: HTMLCanvasElement);
  resize(): void;
  /** Scatter sparkles across a box, rather than bursting from a point. */
  burst(o: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    count?: number;
  }): void;
  start(): void;
  stop(): void;
  clear(): void;
  destroy(): void;
}

export declare class SprayEngine {
  constructor(canvas: HTMLCanvasElement);
  resize(): void;
  spray(o: {
    x: number;
    y: number;
    color: string;
    /** Lighter tone for the haze, so the cloud is not one flat colour. */
    colorSoft?: string;
    /** Radians. 0 fires to the right; the default leans slightly upward. */
    angle?: number;
    power?: number;
  }): void;
  start(): void;
  stop(): void;
  clear(): void;
  destroy(): void;
}
