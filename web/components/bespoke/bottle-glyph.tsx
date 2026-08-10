/**
 * The bottle standing in for "what we're building," used both mid-quiz
 * (EssenceOrb, filling as questions are answered) and on the result page
 * (full, in the matched accord's colour). Previously two separate
 * `border-radius` divs approximating a bottle in the loosest possible sense
 * — this is a real silhouette instead: cap, neck, shoulder, body.
 *
 * Deliberately built from exactly two moving parts, both cheap:
 *   - the liquid level, a `<rect>` whose `y`/`height` transition (a
 *     compositor-only animation, no repaint) as `fill` changes
 *   - a colour, applied as a `background` on a plain div, not an SVG
 *     `fill` attribute — so it can transition the same cheap way the old
 *     orbs did
 * No `filter`, no `backdrop-filter`, nothing that needs re-rasterising on
 * every frame. The perfume gallery spent five rounds chasing exactly that
 * class of bug on a much busier page; this one is static enough it was
 * never going to have it, and it should stay that way.
 */

const CAP_GOLD = "#c9963e";

export function BottleGlyph({
  color,
  fill = 1,
  glow = false,
  className = "",
}: {
  /** The matched (or in-progress) accord's accent colour. */
  color: string;
  /** 0–1, how full the body reads — mid-quiz progress, or 1 once revealed. */
  fill?: number;
  /** A soft, static glow behind the bottle — the result page's reveal only. */
  glow?: boolean;
  className?: string;
}) {
  const level = Math.max(0, Math.min(1, fill));
  // Body interior runs from y=24 (under the shoulder) to y=94 (the floor).
  const bodyTop = 24;
  const bodyBottom = 94;
  const liquidY = bodyBottom - (bodyBottom - bodyTop) * level;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      aria-hidden
      style={
        // box-shadow, not filter: drop-shadow — it's a shadow on the
        // element's own box rather than its alpha silhouette, so it never
        // touches the rasterisation path filters do. Set once on mount,
        // never transitioned, so there's nothing to re-rasterise per frame
        // even though it's a blur.
        glow ? { boxShadow: `0 0 28px ${color}4d` } : undefined
      }
    >
      <svg viewBox="0 0 60 100" className="h-full w-full" role="presentation">
        <defs>
          <clipPath id="bottle-body-clip">
            <path d="M15,26 C15,21 19,20 22,20 L38,20 C41,20 45,21 45,26 L45,88 C45,93 39,95 30,95 C21,95 15,93 15,88 Z" />
          </clipPath>
        </defs>

        {/* Glass, near-empty — a faint fill plus a crisp outline reads as a
            clear bottle without needing a gradient or a blur to sell it. */}
        <path
          d="M15,26 C15,21 19,20 22,20 L38,20 C41,20 45,21 45,26 L45,88 C45,93 39,95 30,95 C21,95 15,93 15,88 Z"
          fill="rgba(0,0,0,0.03)"
          stroke="currentColor"
          strokeOpacity={0.14}
          strokeWidth={1}
          className="text-ink"
        />

        {/* The liquid, clipped to the glass's own silhouette so it never
            reads as a separate rectangle inside a bottle. */}
        <g clipPath="url(#bottle-body-clip)">
          <rect
            x={14}
            y={liquidY}
            width={32}
            height={bodyBottom - liquidY + 2}
            fill={color}
            style={{ transition: "y 500ms ease, height 500ms ease" }}
          />
          {/* One thin highlight, static — not worth animating and cheap
              enough it doesn't need to be. */}
          <rect x={18} y={bodyTop} width={3} height={bodyBottom - bodyTop} fill="#ffffff" opacity={0.12} />
        </g>

        {/* Neck. */}
        <rect x={25} y={11} width={10} height={10} rx={1.5} fill="rgba(0,0,0,0.05)" stroke="currentColor" strokeOpacity={0.14} strokeWidth={1} className="text-ink" />

        {/* Cap — always the house gold, independent of the juice's own
            colour, the same way a real cap doesn't change with what's
            inside it. */}
        <rect x={20} y={2} width={20} height={11} rx={3} fill={CAP_GOLD} />
        <rect x={20} y={2} width={20} height={3.5} rx={2} fill="#ffffff" opacity={0.22} />
      </svg>
    </div>
  );
}

export default BottleGlyph;
