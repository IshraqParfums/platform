"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectLabelPlacement = "above" | "inline";

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  label?: string;
  /** `above` stacks the label; `inline` sits beside the trigger (same row height). */
  labelPlacement?: SelectLabelPlacement;
  /** `paper` is the v2 shop rail. Default cream stays for admin. */
  tone?: "cream" | "paper";
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  /** Extra classes on the visible label (e.g. hide it on small screens). */
  labelClassName?: string;
};

/**
 * Reusable listbox select. Colours stay locked here — pass layout utilities via
 * `className` / `triggerClassName`, not colour overrides (same rule as Eyebrow).
 */
export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  label,
  labelPlacement = "above",
  tone = "cream",
  placeholder = "Select",
  className,
  triggerClassName,
  labelClassName,
}: SelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  const selected = options.find((option) => option.value === value);
  const inline = labelPlacement === "inline";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  function commit(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeIndex);
    }
  }

  const paper = tone === "paper";

  const labelNode = label ? (
    <span
      className={cn(
        "shrink-0",
        inline
          ? paper
            ? "text-sm text-graphite-soft"
            : "text-sm text-ink-soft"
          : "font-mono text-label-sm uppercase tracking-wide text-ink-faint",
        labelClassName,
      )}
    >
      {label}
    </span>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "inline-flex",
        inline ? "flex-row items-center gap-2" : "flex-col gap-1.5",
        className,
      )}
    >
      {labelNode}

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className={cn(
            "inline-flex w-full min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm outline-none transition-colors",
            paper
              ? "border-graphite/25 bg-paper text-graphite hover:border-graphite/40 focus-visible:border-graphite/50"
              : "border-ink/15 bg-cream text-ink hover:border-ink/30 focus-visible:border-ink/40",
            triggerClassName,
          )}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={cn(!selected && (paper ? "text-graphite-faint" : "text-ink-faint"))}>
            {selected?.label ?? placeholder}
          </span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              paper ? "text-graphite-faint" : "text-ink-faint",
              open && "rotate-180",
            )}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${listboxId}-option-${activeIndex}`}
            className={cn(
              "absolute top-full left-0 z-40 mt-1 max-h-60 min-w-full overflow-auto rounded-md border py-1 outline-none",
              paper
                ? "border-graphite/15 bg-paper shadow-[0_12px_32px_-16px_rgba(22,19,16,0.22)]"
                : "border-ink/15 bg-cream shadow-[0_12px_32px_-16px_rgba(28,22,18,0.35)]",
            )}
            onKeyDown={onListKeyDown}
            ref={(node) => node?.focus()}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm transition-colors",
                    paper ? "text-graphite" : "text-ink",
                    isActive && (paper ? "bg-graphite/5" : "bg-ink/5"),
                    isSelected && "font-medium",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
