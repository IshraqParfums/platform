"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDismissable } from "@/lib/ui/use-dismissable";

/**
 * Open state for a md-and-down overlay nav: body scroll lock, close on
 * route change, close when the viewport crosses `md`, Escape / click
 * outside via {@link useDismissable}. Pair with {@link DismissScrim} so
 * taps on the page hit a capturing layer instead of the content under it.
 */
export function useMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    function onChange() {
      if (media.matches) close();
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [close]);

  const rootRef = useDismissable<HTMLElement>(open, close);

  return { open, close, toggle, rootRef };
}
