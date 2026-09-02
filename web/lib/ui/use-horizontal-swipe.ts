import { useCallback, useRef } from "react";
import type { TouchEvent } from "react";

/** Below this, a horizontal drag is a scroll, not a swipe. */
export const HORIZONTAL_SWIPE_THRESHOLD_PX = 40;

/** `1` = next (finger moved left), `-1` = previous. */
export type HorizontalSwipeDelta = -1 | 1;

/**
 * Shared touch swipe for product stills and the PDP plate.
 * Callers own what a swipe *means*; this only reports a direction.
 */
export function useHorizontalSwipe(
  enabled: boolean,
  onSwipe: (delta: HorizontalSwipeDelta) => void,
) {
  const startX = useRef<number | null>(null);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;
      startX.current = event.touches[0]?.clientX ?? null;
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      const start = startX.current;
      startX.current = null;
      if (start === null || !enabled) return;

      const end = event.changedTouches[0]?.clientX ?? start;
      const distance = end - start;
      if (Math.abs(distance) < HORIZONTAL_SWIPE_THRESHOLD_PX) return;
      onSwipe(distance < 0 ? 1 : -1);
    },
    [enabled, onSwipe],
  );

  return { onTouchStart, onTouchEnd };
}
