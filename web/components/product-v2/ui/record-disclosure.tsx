"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * One open key at a time. Opening another row closes the current one;
 * tapping the open row closes it. Shared by FAQ and the info menu so
 * neither invents its own exclusive-open rule.
 */
export function useExclusiveDisclosure<Key extends string | number>() {
  const [openKey, setOpenKey] = useState<Key | null>(null);

  return {
    isOpen: (key: Key) => openKey === key,
    toggle: (key: Key) => {
      setOpenKey((current) => (current === key ? null : key));
    },
  };
}

/**
 * One PDP accordion row — FAQ, "more on this scent", anything else that
 * uses the same type-as-affordance language.
 *
 * APG wiring lives here (`aria-expanded` / `aria-controls` / labelled
 * `region`) so rows don't copy ids. Closed panels stay mounted for the
 * height animation; `inert` is applied after paint so they leave the
 * tab order without a server/client attribute mismatch. Closed/open
 * words are passed in so FAQ can say Read/Close and the info menu
 * Show/Hide without a variant flag.
 */
export function RecordDisclosure({
  open,
  onToggle,
  title,
  closedAffordance,
  openAffordance,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: ReactNode;
  closedAffordance: string;
  openAffordance: string;
  children: ReactNode;
}) {
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
  }, [open]);

  return (
    <div className="border-t border-graphite/10">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-5 text-left"
      >
        <span className="min-w-0 flex-1 font-editorial text-[20px] leading-[1.3] text-graphite">
          {title}
        </span>
        <span className="shrink-0 text-[13px] text-terra">
          {open ? openAffordance : closedAffordance}
        </span>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={open ? undefined : true}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
