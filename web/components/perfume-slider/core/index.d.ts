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

export interface Perfume {
  id: string;
  name: string;
  collection: string;
  concentration: string;
  size: string;
  price: string;
  tagline: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  theme: PerfumeTheme;
}

export interface PerfumeSliderOptions {
  perfumes?: Perfume[];
  /** Starting slide. Default 0. */
  index?: number;
  /** Spray when the active perfume changes. Default true. */
  sprayOnChange?: boolean;
  /** Advance on a timer. Default false. */
  autoplay?: boolean;
  /** Milliseconds between advances. Default 5200. */
  autoplayDelay?: number;
  onChange?: (perfume: Perfume, index: number) => void;
  onSpray?: (perfume: Perfume, index: number) => void;
  /** Fired by the "Discover" call to action. */
  onSelect?: (perfume: Perfume, index: number) => void;
}

export interface PerfumeSliderInstance {
  readonly index: number;
  readonly perfume: Perfume;
  goTo(index: number): void;
  next(): void;
  prev(): void;
  spray(power?: number): void;
  /** Swap the collection at runtime — e.g. once the API responds. */
  setPerfumes(list: Perfume[], keepIndex?: boolean): void;
  destroy(): void;
}

export declare function createPerfumeSlider(
  root: HTMLElement,
  options?: PerfumeSliderOptions,
): PerfumeSliderInstance;

export declare const PERFUMES: Perfume[];

export declare function renderBottle(perfume: Perfume, uid: string): string;

export declare class SprayEngine {
  constructor(canvas: HTMLCanvasElement);
  resize(): void;
  spray(o: { x: number; y: number; color: string; angle?: number; power?: number }): void;
  start(): void;
  stop(): void;
  clear(): void;
  destroy(): void;
}
