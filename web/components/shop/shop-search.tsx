"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ProductListSort } from "@ishraqparfums/shared";
import { SHOP_CONTROL_HEIGHT } from "@/components/shop/shop-control";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { buildShopHref } from "@/lib/shop-query";

const DEBOUNCE_MS = 300;

/**
 * Soft search: debounced `router.replace` so typing does not full-reload the
 * document. Enter commits immediately.
 */
export function ShopSearch({
  q,
  collection,
  sort,
}: {
  q?: string;
  collection?: string;
  sort: ProductListSort;
}) {
  const { navigate } = useShopNavigate();
  const [value, setValue] = useState(q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ collection, sort, q });

  latestRef.current = { collection, sort, q };

  useEffect(() => {
    setValue(q ?? "");
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function commit(nextRaw: string) {
    const next = nextRaw.trim();
    const current = (latestRef.current.q ?? "").trim();
    if (next === current) return;

    navigate(
      buildShopHref({
        collection: latestRef.current.collection,
        q: next || undefined,
        sort: latestRef.current.sort,
      }),
      { replace: true },
    );
  }

  function schedule(next: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commit(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commit(value);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative min-w-0 w-full">
      <label htmlFor="shop-q" className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
      <input
        id="shop-q"
        type="search"
        value={value}
        placeholder="Find a perfume"
        autoComplete="off"
        className={cn(
          "w-full rounded-md border border-ink/15 bg-cream pl-11 pr-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-ink/30 focus:border-ink/40",
          SHOP_CONTROL_HEIGHT,
        )}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          schedule(next);
        }}
        onKeyDown={onKeyDown}
      />
    </form>
  );
}
