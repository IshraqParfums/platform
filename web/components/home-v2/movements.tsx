"use client";

import { useEffect, useRef, useState } from "react";
import { MaskedPhoto } from "@/components/home-v2/ui/masked-photo";
import { RuleEyebrow } from "@/components/home-v2/ui/rule-eyebrow";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { BandInner } from "@/components/home-v2/ui/band";
import { HOME_MOVEMENTS } from "@/lib/content/home-v2";
import { HEADER_HEIGHT_PX } from "@/lib/layout";

const { eyebrow, heading, notes } = HOME_MOVEMENTS;

/** Two hand-offs across the pinned scroll: top → heart → base. */
const THRESHOLDS = [0.34, 0.68];

/**
 * The page's signature interaction: a note pyramid that plays out as you scroll.
 *
 * A tall spacer holds a sticky panel, and scroll progress through the spacer
 * drives two things — which of the three notes is lit, and a slow scale/rise on
 * the photograph. It is the one moment on the page where the reader is shown
 * how a perfume behaves over time rather than told.
 *
 * It is also the one thing here that must not run everywhere:
 *
 * - Below `lg` the pin is off entirely. A 220vh spacer on a phone is not a
 *   degraded animation, it is two full screens of dead scroll — the section
 *   renders as a plain stacked list with every note lit.
 * - Under `prefers-reduced-motion` the same static list is used. Freezing the
 *   CSS (as globals.css does for the decorative animations) would not help,
 *   because the movement here comes from JS driving a transform.
 *
 * In both cases the listener is never attached, so there is no scroll work at
 * all on the devices least able to afford it.
 */
export function Movements() {
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const progressRef = useRef(0);
  const [pinned, setPinned] = useState(false);
  const [progress, setProgress] = useState(0);

  // Decide whether to pin at all, and keep deciding — a rotated tablet crosses
  // the breakpoint without a reload, and the OS motion setting can change live.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      const next = wide.matches && !still.matches;
      setPinned(next);
      if (!next) {
        setProgress(0);
        progressRef.current = 0;
      }
    };

    sync();
    wide.addEventListener("change", sync);
    still.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!pinned) return;

    const measure = () => {
      frameRef.current = 0;
      const el = spacerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const next =
        travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;

      // A scroll event fires far more often than the panel actually changes.
      // Re-rendering on sub-pixel movement is what makes this kind of section
      // stutter, so only commit past a threshold the eye can resolve.
      if (Math.abs(next - progressRef.current) > 0.003) {
        progressRef.current = next;
        setProgress(next);
      }
    };

    const onScroll = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [pinned]);

  const active = !pinned
    ? -1 // -1 lights every note, which is the static reading
    : progress < THRESHOLDS[0]
      ? 0
      : progress < THRESHOLDS[1]
        ? 1
        : 2;

  const photoTransform = pinned
    ? `scale(${(1 + progress * 0.14).toFixed(3)}) translateY(${(-progress * 26).toFixed(1)}px)`
    : undefined;

  return (
    // The spacer is what the sticky panel travels inside; without the pin it
    // collapses to the panel's own height. The two class hooks let the
    // reduced-motion block in globals.css collapse the pin declaratively —
    // doing it from `pinned` instead would mean rendering the tall layout on the
    // server and tearing it down after hydration, i.e. a visible jump for
    // exactly the users who asked for less movement.
    <div ref={spacerRef} className="movements-spacer relative z-[1] lg:h-[220vh]">
      <div
        className="movements-panel lg:sticky lg:flex lg:items-center"
        style={
          pinned
            ? {
                top: HEADER_HEIGHT_PX,
                height: `calc(100vh - ${HEADER_HEIGHT_PX}px)`,
              }
            : undefined
        }
      >
        <BandInner className="py-16 lg:py-0">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-[70px]">
            <div className="relative h-[280px] sm:h-[380px] lg:h-[min(74vh,620px)] lg:self-stretch">
              <MaskedPhoto
                src="/home/trunk-linens.webp"
                alt=""
                tight
                sizes="(min-width: 1024px) 42vw, 100vw"
                objectPosition="center 50%"
                transform={photoTransform}
              />
            </div>

            <div>
              <RuleEyebrow tone="indigo">{eyebrow}</RuleEyebrow>

              <Urdu size="md" className="mt-3 lg:mt-5">
                {heading.urdu}
              </Urdu>

              <h2 className="mt-1 font-editorial text-h2-editorial text-graphite">
                {heading.english}
              </h2>

              <ol className="mt-6 flex flex-col lg:mt-8">
                {notes.map((note, i) => {
                  const lit = active === -1 || active === i;
                  return (
                    <li
                      key={note.key}
                      className="grid grid-cols-[52px_1fr] gap-5 border-t border-graphite/10 py-4 transition-opacity duration-500 sm:grid-cols-[64px_1fr] sm:gap-[22px] lg:py-[clamp(9px,2vh,20px)]"
                      style={{ opacity: lit ? 1 : 0.3 }}
                    >
                      <div>
                        <p className="font-ui text-micro-sm font-semibold uppercase text-indigo">
                          {note.key}
                        </p>
                        <div
                          aria-hidden="true"
                          className="mt-2 h-0.5 rounded-sm transition-colors duration-500"
                          style={{
                            background: lit
                              ? "var(--color-indigo)"
                              : "rgba(23,21,18,0.12)",
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-editorial text-h4-editorial text-graphite">
                          {note.title}
                        </p>
                        <p className="mt-1 max-w-[390px] text-[14px] leading-[1.5] text-graphite-soft">
                          {note.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </BandInner>
      </div>
    </div>
  );
}
