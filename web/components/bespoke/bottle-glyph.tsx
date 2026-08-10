"use client";

/**
 * The bottle standing in for "what we're building," used both mid-quiz
 * (EssenceOrb, filling as questions are answered) and on the result page
 * (full, in the matched accord's colour). Previously two separate
 * `border-radius` divs approximating a bottle in the loosest possible sense
 * — this is a real silhouette instead: cap, neck, shoulder, body, with the
 * liquid reading as liquid rather than a progress bar wearing a bottle
 * costume.
 *
 * Everything that moves is `transform` or `opacity`, nothing else —
 * compositor-only properties that never trigger a repaint, let alone the
 * rasterisation cost a `filter` or `backdrop-filter` carries. The perfume
 * gallery spent five rounds chasing exactly that class of bug on a much
 * busier page; the sheen sweep and the sparkles below are new, continuous,
 * looping animations that didn't exist when that reasoning was first
 * written here, so it's worth restating: `y`/`height` on the fill-level
 * rect (an SVG geometry animation, not a CSS one, but still compositor-
 * cheap and only 500ms, not continuous) is the one thing that isn't a
 * transform, and it only runs when `fill` actually changes, not on a loop.
 */

import { useId } from "react";

/** Fixed positions within the bottle's own interior (viewBox space, not
 *  screen space) — clipped to the glass silhouette below, so a sparkle
 *  only ever shows up once the liquid has actually risen past it. Numbers
 *  are hand-placed, not random: evenly spread rather than risking a
 *  Math.random() clump on any given render. */
const SPARKLES = [
  { cx: 21, cy: 42, r: 1.1, delay: "0s" },
  { cx: 32, cy: 55, r: 0.9, delay: "0.6s" },
  { cx: 26, cy: 68, r: 1.3, delay: "1.3s" },
  { cx: 37, cy: 78, r: 0.8, delay: "2.1s" },
  { cx: 19, cy: 85, r: 1, delay: "2.8s" },
];

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
  const uid = useId();
  const clipId = `bottle-clip-${uid}`;
  const liquidGradId = `bottle-liquid-${uid}`;
  const sheenGradId = `bottle-sheen-${uid}`;
  const capGradId = `bottle-cap-${uid}`;

  const level = Math.max(0, Math.min(1, fill));
  // Body interior runs from y=24 (under the shoulder) to y=94 (the floor).
  const bodyTop = 24;
  const bodyBottom = 94;
  const liquidY = bodyBottom - (bodyBottom - bodyTop) * level;
  const bodyPath =
    "M15,26 C15,21 19,20 22,20 L38,20 C41,20 45,21 45,26 L45,88 C45,93 39,95 30,95 C21,95 15,93 15,88 Z";

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
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .bottle-glyph-sheen {
            animation: bottle-glyph-sheen-sweep 3.6s ease-in-out infinite;
          }
          .bottle-glyph-sparkle {
            animation: bottle-glyph-twinkle 2.6s ease-in-out infinite;
          }
        }
        @keyframes bottle-glyph-sheen-sweep {
          0%, 100% { transform: translate(-14px, -4px) rotate(18deg); opacity: 0; }
          15% { opacity: 0.55; }
          50% { transform: translate(14px, 4px) rotate(18deg); opacity: 0.55; }
          85% { opacity: 0; }
        }
        @keyframes bottle-glyph-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          50% { opacity: 0.9; transform: scale(1); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .bottle-glyph-cap-glint {
            animation: bottle-glyph-cap-shine 4.5s ease-in-out infinite;
          }
        }
        @keyframes bottle-glyph-cap-shine {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
      `}</style>
      <svg viewBox="0 0 60 100" className="h-full w-full" role="presentation">
        <defs>
          <clipPath id={clipId}>
            <path d={bodyPath} />
          </clipPath>
          {/* Depth, not just colour: a touch lighter where the surface
              catches light, a touch richer toward the glass — the
              difference between a colour swatch and something poured. */}
          <linearGradient id={liquidGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.75} />
            <stop offset="12%" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="30%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={sheenGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
          {/* The same light-dark-light banding a real polished cylinder
              shows, not a flat swatch — the difference between
              "gold-coloured" and "gold". Same palette the gold button ring
              elsewhere in the app already uses. */}
          <linearGradient id={capGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a320d" />
            <stop offset="20%" stopColor="#c9963e" />
            <stop offset="42%" stopColor="#fff3cf" />
            <stop offset="60%" stopColor="#e0b463" />
            <stop offset="82%" stopColor="#8a6318" />
            <stop offset="100%" stopColor="#4a320d" />
          </linearGradient>
        </defs>

        {/* Glass, near-empty — a faint fill plus a crisp outline reads as a
            clear bottle without needing a gradient or a blur to sell it. */}
        <path
          d={bodyPath}
          fill="rgba(0,0,0,0.03)"
          stroke="currentColor"
          strokeOpacity={0.14}
          strokeWidth={1}
          className="text-ink"
        />

        {/* The liquid, clipped to the glass's own silhouette so it never
            reads as a separate rectangle inside a bottle. */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={14}
            y={liquidY}
            width={32}
            height={bodyBottom - liquidY + 2}
            fill={`url(#${liquidGradId})`}
            style={{ transition: "y 500ms ease, height 500ms ease" }}
          />
          {/* A diagonal band of light, sweeping slowly and forever — what
              turns a flat fill into something that reads as liquid rather
              than paint. transform + opacity only, so it's exactly as
              cheap looping as it is sitting still. */}
          <rect
            className="bottle-glyph-sheen"
            x={10}
            y={bodyTop - 10}
            width={10}
            height={bodyBottom - bodyTop + 20}
            fill={`url(#${sheenGradId})`}
          />
          {/* One thin static highlight along the glass edge, underneath the
              sheen — the constant the sweep passes over. */}
          <rect x={18} y={bodyTop} width={3} height={bodyBottom - bodyTop} fill="#ffffff" opacity={0.12} />
          {/* Motes of light in the liquid itself — only ever visible once
              the fill has actually risen past a given one, same as real
              liquid catching motes of dust or air. */}
          {SPARKLES.map((s, i) => (
            <circle
              key={i}
              className="bottle-glyph-sparkle"
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#ffffff"
              style={{ animationDelay: s.delay, transformOrigin: `${s.cx}px ${s.cy}px` }}
            />
          ))}
        </g>

        {/* Neck. */}
        <rect x={25} y={11} width={10} height={10} rx={1.5} fill="rgba(0,0,0,0.05)" stroke="currentColor" strokeOpacity={0.14} strokeWidth={1} className="text-ink" />

        {/* Cap — always the house gold, independent of the juice's own
            colour, the same way a real cap doesn't change with what's
            inside it. Metal gradient body, a dark rim where it seats
            against the neck, and one bright off-centre glint rather than
            a flat translucent strip — a glint pulses slowly (opacity
            only) so "shiny" doesn't compete with the liquid's own
            animation for attention. */}
        <rect x={20} y={2} width={20} height={11} rx={3} fill={`url(#${capGradId})`} stroke="#3a2408" strokeOpacity={0.35} strokeWidth={0.5} />
        <rect x={20} y={9.6} width={20} height={1} rx={0.5} fill="#3a2408" opacity={0.28} />
        <ellipse className="bottle-glyph-cap-glint" cx={26} cy={5} rx={4} ry={1.6} fill="#ffffff" opacity={0.6} />
      </svg>
    </div>
  );
}

export default BottleGlyph;
