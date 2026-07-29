import { cn } from "@/lib/cn";

type MistTone = "gold" | "cream" | "rose";
type MistStrength = "subtle" | "medium" | "strong";

/** Tint is applied through `color`, since each layer paints `currentColor`. */
const TONES: Record<MistTone, string> = {
  gold: "text-gold-soft",
  cream: "text-cream",
  rose: "text-rose",
};

/**
 * Three parallax layers: a slow broad bank, a mid drift, and finer wisps.
 * Opacities stay low by design — the effect should register as atmosphere,
 * never as texture sitting on top of the content.
 */
const LAYERS = [
  { src: "/textures/mist-far.png", tile: "1100px", anim: "mist-drift-a", seconds: 190 },
  { src: "/textures/mist-mid.png", tile: "820px", anim: "mist-drift-b", seconds: 140 },
  { src: "/textures/mist-near.png", tile: "560px", anim: "mist-drift-c", seconds: 95 },
] as const;

const STRENGTH: Record<MistStrength, number[]> = {
  subtle: [0.07, 0.05, 0.035],
  medium: [0.11, 0.08, 0.055],
  strong: [0.16, 0.12, 0.08],
};

export function Mist({
  tone = "gold",
  strength = "medium",
  className,
}: {
  tone?: MistTone;
  strength?: MistStrength;
  className?: string;
}) {
  const opacities = STRENGTH[strength];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        TONES[tone],
        className,
      )}
    >
      {LAYERS.map((layer, i) => (
        <div
          key={layer.src}
          className="mist-layer"
          style={{
            // Custom properties drive both the mask and the travel distance,
            // so a layer can never drift by anything other than one whole tile.
            ["--mist-src" as string]: `url(${layer.src})`,
            ["--mist-tile" as string]: layer.tile,
            opacity: opacities[i],
            animation: `${layer.anim} ${layer.seconds}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
