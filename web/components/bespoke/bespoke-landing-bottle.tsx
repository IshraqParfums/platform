"use client";

import { useEffect, useState } from "react";
import {
  BESPOKE_DIMENSIONS,
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeDimension,
} from "@ishraqparfums/shared";
import { BottleGlyph } from "@/components/bespoke/bottle-glyph";
import { cn } from "@/lib/cn";

const CYCLE_MS = 3200;
const LOCKED: BespokeDimension = "woody";
const START_INDEX = BESPOKE_DIMENSIONS.indexOf(LOCKED);

/**
 * Landing stand-in for the result bottle. Same glyph, juice stepping through
 * family accents so the stage has something to show before a match exists.
 * Colour snaps (SVG stopColor does not interpolate) — that read is a family
 * change, not a missed transition.
 */
export function BespokeLandingBottle() {
  const [index, setIndex] = useState(START_INDEX);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduceMotion(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % BESPOKE_DIMENSIONS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const dim = reduceMotion ? LOCKED : BESPOKE_DIMENSIONS[index];
  const color = BESPOKE_FAMILY_COLOR[dim];

  return (
    <div className="flex w-full flex-col items-center">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .bespoke-landing-bottle-float {
            animation: bespoke-landing-bottle-float 5s ease-in-out infinite;
          }
        }
        @keyframes bespoke-landing-bottle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <div className="relative flex aspect-square w-full max-w-[28rem] items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-[6%] rounded-full bg-paper-deep"
          style={{
            boxShadow: `inset 0 0 80px ${color}40`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[6%] rounded-full border"
          style={{ borderColor: `${color}66` }}
        />
        <div
          className={cn(
            "relative z-[1]",
            !reduceMotion && "bespoke-landing-bottle-float",
          )}
        >
          <BottleGlyph
            color={color}
            fill={1}
            className="h-[min(48vh,360px)] w-[min(34vw,170px)]"
          />
        </div>
      </div>
      <p className="mt-5 font-ui text-micro-sm font-semibold uppercase tracking-[0.24em] text-graphite-mute">
        {BESPOKE_DIMENSION_LABEL[dim]}
      </p>
    </div>
  );
}
