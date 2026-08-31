import { useEffect, useRef } from "react";

/**
 * Click-outside + Escape dismissal for a popover/dropdown. The same six
 * lines were already hand-rolled independently in `ui/select.tsx` and
 * `ui/help-tip.tsx`; this is the third occurrence, so it's a shared hook
 * instead of a third copy. Returns the ref to attach to the popover's root.
 */
export function useDismissable<T extends HTMLElement>(
  open: boolean,
  onDismiss: () => void,
) {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onDismiss]);

  return rootRef;
}
