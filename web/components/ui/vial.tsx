import { cn } from "@/lib/cn";

export interface VialBands {
  /** Percentages of the total fill, top/heart/base — they should sum to 100. */
  top: number;
  heart: number;
  base: number;
}

/**
 * The brand motif, carried over from the bespoke prototype. Pure CSS so it
 * costs nothing and scales crisply. Returns in the bespoke quiz in Phase 5.
 */
export function Vial({
  bands = { top: 30, heart: 40, base: 30 },
  fill = 78,
  width = 78,
  height = 150,
  className,
}: {
  bands?: VialBands;
  /** How full the vial is, 0–100. */
  fill?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("vial", className)}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div className="vial-fill" style={{ height: `${fill}%` }}>
        <div
          className="vial-band"
          style={{
            height: `${bands.base}%`,
            background: "linear-gradient(180deg,#8A5A2E,#5E3A1C)",
          }}
        />
        <div
          className="vial-band"
          style={{
            height: `${bands.heart}%`,
            background: "linear-gradient(180deg,#C6685A,#A84E42)",
          }}
        />
        <div
          className="vial-band"
          style={{
            height: `${bands.top}%`,
            background: "linear-gradient(180deg,#E0BD84,#C9963E)",
          }}
        />
      </div>
    </div>
  );
}
