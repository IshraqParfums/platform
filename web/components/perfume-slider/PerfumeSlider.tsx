"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import {
  createPerfumeSlider,
  type Facing,
  type Perfume,
  type PerfumeSliderInstance,
  type PerfumeSliderOptions,
} from "./core";
import "./core/slider.css";

export type { Facing, Perfume, PerfumeSliderInstance } from "./core";

export interface PerfumeSliderProps
  extends Pick<
    PerfumeSliderOptions,
    | "perfumes"
    | "index"
    | "facing"
    | "sprayOnLoad"
    | "sprayOnChange"
    | "sprayOnSlide"
    | "autoplay"
    | "autoplayDelay"
  > {
  className?: string;
  onChange?: (perfume: Perfume, index: number) => void;
  onSpray?: (perfume: Perfume, index: number) => void;
  onSelect?: (perfume: Perfume, index: number) => void;
  /** Imperative handle — `ref.current?.next()`, `.spray()`, `.goTo(i)`. */
  ref?: Ref<PerfumeSliderInstance>;
}

/**
 * React wrapper around the framework-agnostic slider core.
 *
 * The slider owns its own DOM, so React only supplies the mount node. Callbacks
 * are read through a ref, which keeps a re-render from tearing down and
 * rebuilding the slider every time a parent passes a new inline function.
 */
export function PerfumeSlider({
  perfumes,
  index = 0,
  facing = 0,
  sprayOnLoad = false,
  sprayOnChange = false,
  sprayOnSlide = true,
  autoplay = false,
  autoplayDelay,
  className,
  onChange,
  onSpray,
  onSelect,
  ref,
}: PerfumeSliderProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<PerfumeSliderInstance | null>(null);

  // Callbacks are read through a ref so a parent passing new inline functions
  // on every render doesn't tear the slider down and rebuild it.
  const handlers = useRef({ onChange, onSpray, onSelect });
  useEffect(() => {
    handlers.current = { onChange, onSpray, onSelect };
  });

  // A stable handle that delegates to the live instance. It cannot simply
  // return `sliderRef.current`: this hook commits before the effect below
  // constructs the slider, so that would pin the handle to null forever.
  useImperativeHandle(
    ref,
    () => ({
      get index() {
        return sliderRef.current?.index ?? 0;
      },
      get perfume() {
        return sliderRef.current!.perfume;
      },
      get facing() {
        return sliderRef.current?.facing ?? 0;
      },
      get glassAnchor() {
        return sliderRef.current?.glassAnchor ?? 0;
      },
      setFacing: (next: Facing, spraying?: boolean) =>
        sliderRef.current?.setFacing(next, spraying),
      goTo: (i: number) => sliderRef.current?.goTo(i),
      next: () => sliderRef.current?.next(),
      prev: () => sliderRef.current?.prev(),
      spray: (power?: number) => sliderRef.current?.spray(power),
      setPerfumes: (list: Perfume[], keepIndex?: boolean) =>
        sliderRef.current?.setPerfumes(list, keepIndex),
      destroy: () => sliderRef.current?.destroy(),
    }),
    [],
  );

  useEffect(() => {
    const node = mountRef.current;
    if (!node) return;

    const slider = createPerfumeSlider(node, {
      perfumes,
      index,
      facing,
      sprayOnLoad,
      sprayOnChange,
      sprayOnSlide,
      autoplay,
      ...(autoplayDelay ? { autoplayDelay } : {}),
      onChange: (p, i) => handlers.current.onChange?.(p, i),
      onSpray: (p, i) => handlers.current.onSpray?.(p, i),
      onSelect: (p, i) => handlers.current.onSelect?.(p, i),
    });

    sliderRef.current = slider;

    return () => {
      slider.destroy();
      sliderRef.current = null;
    };
    // `index` is the initial slide only; changing it later should not remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfumes, facing, sprayOnLoad, sprayOnChange, sprayOnSlide, autoplay, autoplayDelay]);

  return <div ref={mountRef} className={className} />;
}

export default PerfumeSlider;
