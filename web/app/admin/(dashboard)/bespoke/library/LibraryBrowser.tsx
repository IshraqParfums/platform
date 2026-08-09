"use client";

import { useMemo, useState } from "react";

import { ScentPrismMini, type ScentVector } from "./ScentPrism";

interface PerfumeSummary {
  id: string;
  name: string;
  collection: string;
  tagline: string;
  family: string;
  profile: ScentVector | null;
}

interface AccordSummary {
  id: string;
  name: string;
  inspiration: string;
  composite: boolean;
  layer: string | null;
  primaryFamily: string | null;
  secondaryFamily: string | null;
  vector: ScentVector;
}

/** Enough pills to be useful before the filter starts outweighing the results
 *  it filters. Ten families fit comfortably; fifty-eight collections do not —
 *  those ran to eight rows and pushed every result below the fold. */
const TAGS_COLLAPSED = 12;

function TagRow({
  tags,
  active,
  onToggle,
}: {
  tags: string[];
  active: string | null;
  onToggle: (tag: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflowing = tags.length > TAGS_COLLAPSED;
  // The selected tag stays visible even when it sorts below the cut, so the
  // current filter is never hidden behind "show all".
  const shown = !overflowing || expanded
    ? tags
    : [...new Set([...tags.slice(0, TAGS_COLLAPSED), ...(active ? [active] : [])])];

  const pill = (isActive: boolean) =>
    `rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
      isActive
        ? "border-[#c9963e] bg-[#c9963e]/15 text-[#f6ecdc]"
        : "border-[#f6ecdc]/20 text-[#f6ecdc]/60 hover:border-[#f6ecdc]/40"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onToggle(null)} className={pill(active === null)}>
        All
      </button>
      {shown.map((tag) => (
        <button key={tag} type="button" onClick={() => onToggle(tag)} className={pill(active === tag)}>
          {tag}
        </button>
      ))}
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full px-3 py-1 text-xs uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
        >
          {expanded ? "Show fewer" : `+${tags.length - TAGS_COLLAPSED} more`}
        </button>
      )}
    </div>
  );
}

/**
 * How many cards to put in the DOM before making you ask for more.
 *
 * Every card draws a ScentPrismMini, which is a real SVG. At 1,081 accords
 * that's 1,081 of them rendered at once and a page tens of thousands of
 * pixels tall — unusable to scroll and slow to paint, for a list nobody
 * reads past the top of anyway. Filters and search run over the *whole*
 * set; only the rendering is capped, so nothing becomes unreachable.
 */
const PAGE_SIZE = 60;

export function LibraryBrowser({ perfumes, accords }: { perfumes: PerfumeSummary[]; accords: AccordSummary[] }) {
  const [tab, setTab] = useState<"perfumes" | "accords">("accords");
  const [query, setQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  // Any change to what's being searched or filtered starts the window over —
  // otherwise "load more" from a previous query silently carries across.
  function resetWindow<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setShown(PAGE_SIZE);
    };
  }

  const collections = useMemo(() => [...new Set(perfumes.map((p) => p.collection))].sort(), [perfumes]);
  const families = useMemo(
    () => [...new Set(accords.map((a) => a.primaryFamily).filter((f): f is string => Boolean(f)))].sort(),
    [accords],
  );

  const filteredPerfumes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return perfumes.filter((p) => {
      if (collectionFilter && p.collection !== collectionFilter) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.tagline.toLowerCase().includes(needle) ||
        p.collection.toLowerCase().includes(needle)
      );
    });
  }, [perfumes, query, collectionFilter]);

  const filteredAccords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accords.filter((a) => {
      if (familyFilter && a.primaryFamily !== familyFilter) return false;
      if (!needle) return true;
      return (
        a.name.toLowerCase().includes(needle) ||
        a.inspiration.toLowerCase().includes(needle) ||
        a.id.toLowerCase().includes(needle)
      );
    });
  }, [accords, query, familyFilter]);

  const visible = tab === "accords" ? filteredAccords : filteredPerfumes;
  const total = tab === "accords" ? accords.length : perfumes.length;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex gap-2 border-b border-[#f6ecdc]/10 pb-3">
        <button
          type="button"
          onClick={() => {
            setTab("accords");
            setShown(PAGE_SIZE);
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "accords" ? "bg-[#c9963e] text-[#241510]" : "text-[#f6ecdc]/60 hover:text-[#f6ecdc]"
          }`}
        >
          Accords ({accords.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("perfumes");
            setShown(PAGE_SIZE);
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "perfumes" ? "bg-[#c9963e] text-[#241510]" : "text-[#f6ecdc]/60 hover:text-[#f6ecdc]"
          }`}
        >
          Perfumes ({perfumes.length})
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => resetWindow(setQuery)(e.target.value)}
        placeholder={
          tab === "accords" ? "Search accords by name, inspiration, or id…" : "Search perfumes by name, tagline, or collection…"
        }
        className="rounded-lg border border-[#f6ecdc]/20 bg-transparent px-3 py-2.5 text-[#f6ecdc] outline-none focus:border-[#c9963e]"
      />

      {tab === "accords" ? (
        <>
          <TagRow tags={families} active={familyFilter} onToggle={resetWindow(setFamilyFilter)} />
          <ResultCount shown={Math.min(shown, filteredAccords.length)} matching={filteredAccords.length} total={total} noun="accords" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredAccords.slice(0, shown).map((a) => (
              <a
                key={a.id}
                href={`/admin/bespoke/library/accords/${a.id}`}
                className="flex items-start gap-3 rounded-xl border border-[#f6ecdc]/15 bg-[#f6ecdc]/5 px-4 py-3 transition-colors hover:border-[#c9963e]"
              >
                <ScentPrismMini vector={a.vector} className="mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#f6ecdc]">{a.name}</p>
                    {a.composite && (
                      <span className="rounded-full bg-[#c9963e]/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#c9963e]">
                        composite
                      </span>
                    )}
                  </div>
                  {/* An accord's name is derived from the first clause of its
                      inspiration, so for short ones the two are the same
                      string and printing both just stutters. */}
                  {a.inspiration && a.inspiration !== a.name && (
                    <p className="mt-1 text-xs text-[#f6ecdc]/50">{a.inspiration}</p>
                  )}
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
                    {a.primaryFamily ?? "—"}
                    {a.secondaryFamily ? ` · ${a.secondaryFamily}` : ""} · {a.layer ?? "unknown layer"}
                  </p>
                </div>
              </a>
            ))}
          </div>
          {filteredAccords.length === 0 && <p className="text-sm text-[#f6ecdc]/50">No accords match.</p>}
        </>
      ) : (
        <>
          <TagRow tags={collections} active={collectionFilter} onToggle={resetWindow(setCollectionFilter)} />
          <ResultCount shown={Math.min(shown, filteredPerfumes.length)} matching={filteredPerfumes.length} total={total} noun="perfumes" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredPerfumes.slice(0, shown).map((p) => (
              <a
                key={p.id}
                href={`/admin/bespoke/library/perfumes/${p.id}`}
                className="flex items-start gap-3 rounded-xl border border-[#f6ecdc]/15 bg-[#f6ecdc]/5 px-4 py-3 transition-colors hover:border-[#c9963e]"
              >
                {p.profile && <ScentPrismMini vector={p.profile} className="mt-0.5 shrink-0" />}
                <div>
                  <p className="font-medium text-[#f6ecdc]">{p.name}</p>
                  <p className="mt-1 text-xs text-[#f6ecdc]/50">{p.tagline}</p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
                    {p.collection} · {p.family}
                  </p>
                </div>
              </a>
            ))}
          </div>
          {filteredPerfumes.length === 0 && <p className="text-sm text-[#f6ecdc]/50">No perfumes match.</p>}
        </>
      )}

      {visible.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className="mx-auto rounded-full border border-[#c9963e]/40 px-6 py-2 text-xs uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
        >
          Show {Math.min(PAGE_SIZE, visible.length - shown)} more
        </button>
      )}
    </div>
  );
}

/** "Showing 60 of 1,081" — so a capped list never reads as the whole library. */
function ResultCount({
  shown,
  matching,
  total,
  noun,
}: {
  shown: number;
  matching: number;
  total: number;
  noun: string;
}) {
  const filtered = matching !== total;
  return (
    <p className="text-xs text-[#f6ecdc]/40">
      Showing <span className="text-[#f6ecdc]/70">{shown.toLocaleString()}</span> of{" "}
      <span className="text-[#f6ecdc]/70">{matching.toLocaleString()}</span>
      {filtered ? ` matching ${noun} (${total.toLocaleString()} total)` : ` ${noun}`}
    </p>
  );
}

export default LibraryBrowser;
