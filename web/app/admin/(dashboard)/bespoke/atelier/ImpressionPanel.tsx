"use client";

/**
 * What you have made — as opposed to what it is made of.
 *
 * The other three panels answer technical questions. This one answers the
 * question you actually have at the bench, which is what the thing feels
 * like, and it answers it without a single invented word: the colours are
 * the house family hues mixed by contribution, the temperature and weight
 * are the palette's own per-material readings, the facets come from the
 * canonical vocabulary, and the sentence under each act is the lead
 * material's own `odour` field, verbatim.
 *
 * Three moments rather than one average, because the arc IS the perfume. A
 * single blended description would hide the only thing worth knowing.
 */

import {
  BESPOKE_DIMENSIONS as DIMENSIONS,
  BESPOKE_FAMILY_COLOR as FAMILY_COLOR,
  facetLabel,
  temperatureWord,
  timeToFraction,
  weightWord,
  type FacetLexicon,
  type Impression,
  type ImpressionAct,
} from "@ishraqparfums/shared";

export function ImpressionPanel({
  impression,
  lexicon,
  colours,
  hasFormula,
}: {
  impression: Impression;
  lexicon: FacetLexicon;
  colours: Map<string, string>;
  hasFormula: boolean;
}) {
  if (!hasFormula) {
    return (
      <p className="py-8 text-center text-sm text-[#f6ecdc]/40">
        Add a material and this will tell you what you have made.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------- the arc */}
      {impression.arc && (
        <p className="text-base leading-relaxed text-[#f6ecdc]/85">{impression.arc}</p>
      )}

      {/* ------------------------------------------------------- the ribbon */}
      <div>
        <div
          className="h-14 w-full overflow-hidden rounded-lg"
          style={{ background: ribbonGradient(impression) }}
          role="img"
          aria-label="The colour of the blend across twenty-four hours on skin"
        />
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[#f6ecdc]/30">
          <span>spray</span>
          <span>15m</span>
          <span>1h</span>
          <span>3h</span>
          <span>6h</span>
          <span>12h</span>
          <span>24h</span>
        </div>
        <p className="mt-1 text-[10px] text-[#f6ecdc]/30">
          Family hues mixed by how much each is in the air. The same colours the bottles use.
        </p>
      </div>

      {/* --------------------------------------------------------- the acts */}
      <div className="grid gap-3 lg:grid-cols-3">
        {impression.acts.map((act) => (
          <ActCard key={act.key} act={act} lexicon={lexicon} colours={colours} />
        ))}
      </div>

      {/* ------------------------------------------------- shape and feeling */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">Its shape</p>
          <ul className="mt-2.5 space-y-1.5">
            {DIMENSIONS.filter((d) => impression.vector[d] > 0.04)
              .sort((a, b) => impression.vector[b] - impression.vector[a])
              .map((dim) => (
                <li key={dim} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-[#f6ecdc]/60">{dim}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f6ecdc]/8">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${impression.vector[dim] * 100}%`,
                        background: FAMILY_COLOR[dim],
                      }}
                    />
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
            What it is reaching for
          </p>
          {impression.emotions.length === 0 ? (
            <p className="mt-2 text-xs text-[#f6ecdc]/40">
              None of these materials carry an authored feeling.
            </p>
          ) : (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {impression.emotions.map((e, i) => (
                <li
                  key={e.word}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    background: `rgba(201, 150, 62, ${(0.24 - i * 0.022).toFixed(3)})`,
                    color: i < 3 ? "#e8c98a" : "rgba(246,236,220,0.6)",
                  }}
                >
                  {e.word}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2.5 text-[10px] leading-relaxed text-[#f6ecdc]/30">
            The palette&rsquo;s own emotion words, weighted by how much of each material is
            actually in the air over the wearing.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ nearest in the range */}
      {impression.nearest.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
            Nearest thing you have already made
          </p>
          <ul className="mt-2 space-y-1.5">
            {impression.nearest.map((p) => (
              <li key={p.id} className="flex items-baseline gap-3 text-xs">
                <a
                  href={`/discover/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#f6ecdc]/80 underline decoration-[#f6ecdc]/20 underline-offset-2 transition-colors hover:text-[#c9963e]"
                >
                  {p.name}
                </a>
                {p.collection && (
                  <span className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/30">
                    {p.collection}
                  </span>
                )}
                <span className="ml-auto tabular-nums text-[#f6ecdc]/45">
                  {Math.round(p.similarity * 100)}% alike
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#f6ecdc]/30">
            Matched on the ten-dimension family shape only — the same axes the bespoke engine
            ranks on. Two perfumes can share a shape and smell nothing alike, so treat this as a
            neighbourhood, not a verdict.
          </p>
        </div>
      )}
    </div>
  );
}

function ActCard({
  act,
  lexicon,
  colours,
}: {
  act: ImpressionAct;
  lexicon: FacetLexicon;
  colours: Map<string, string>;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] p-3.5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-white/20"
          style={{ background: act.colour }}
        />
        <p className="text-[11px] uppercase tracking-wide text-[#c9963e]">{act.label}</p>
      </div>

      {act.silent ? (
        <p className="mt-3 text-xs text-[#f6ecdc]/35">Nothing left by now.</p>
      ) : (
        <>
          <p className="mt-2.5 text-xs leading-relaxed text-[#f6ecdc]/70">{act.line}</p>

          <ul className="mt-2.5 flex flex-wrap gap-1">
            {act.facets.map((f) => (
              <li
                key={f.facet}
                className="rounded-full bg-[#f6ecdc]/8 px-2 py-0.5 text-[10px] text-[#f6ecdc]/60"
              >
                {facetLabel(lexicon, f.facet)}
              </li>
            ))}
          </ul>

          <p className="mt-2.5 text-[10px] text-[#f6ecdc]/40">
            {temperatureWord(act.temperature)} · {weightWord(act.weight)}
          </p>

          <ul className="mt-2.5 space-y-1 border-t border-[#f6ecdc]/8 pt-2">
            {act.dominant.map((d) => (
              <li key={d.material.id} className="flex items-center gap-1.5 text-[11px]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: colours.get(d.material.id) }}
                />
                <span className="truncate text-[#f6ecdc]/65">
                  {d.material.name.split(" (")[0]}
                </span>
                <span className="ml-auto shrink-0 tabular-nums text-[#f6ecdc]/35">
                  {Math.round(d.share * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * The ribbon uses the chart's own square-root time axis, so a position along
 * it means the same moment as the same position on the curves above.
 */
function ribbonGradient(impression: Impression): string {
  const stops = impression.ribbon.map(
    (s) => `${s.colour} ${(timeToFraction(s.hours) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
