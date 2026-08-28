"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeDimension,
  type BespokeNotesByPosition,
  type BespokeSessionResultResponse,
} from "@ishraqparfums/shared";
import { BespokeBrewPurchase } from "@/components/bespoke/bespoke-brew-purchase";
import { BottleGlyph } from "@/components/bespoke/bottle-glyph";
import { BespokeBrewSkeleton } from "@/components/bespoke/bespoke-skeletons";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { Button, ButtonLink } from "@/components/ui/button";
import { loadBespokeSessionResult } from "@/lib/bespoke/complete-session";

/**
 * The payoff. Full-width: larger bottle, notes pyramid, size and price
 * without requiring Save first. `loadBespokeSessionResult` completes the
 * session on 401/404/409 so the quiz can navigate here on the last tap.
 */
export function BespokeResultClient() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;
  const [result, setResult] = useState<BespokeSessionResultResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await loadBespokeSessionResult(sessionId);
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load result");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function saveOnly() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bespoke/sessions/${sessionId}/claim`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/bespoke/result/${sessionId}`)}`,
        );
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Could not save your blend");
      }
      const data = (await res.json()) as BespokeSessionResultResponse;
      setResult(data);
      router.push("/bespoke/saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (error && !result) {
    return (
      <section className="bg-paper py-16 md:py-24">
        <BandInner>
          <p className="text-[15px] text-terra" role="alert">
            {error}
          </p>
          <ButtonLink href="/bespoke/quiz" variant="ink" size="pill" className="mt-6">
            Restart the quiz
          </ButtonLink>
        </BandInner>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="bg-paper py-16 md:py-24">
        <BandInner>
          <BespokeBrewSkeleton />
        </BandInner>
      </section>
    );
  }

  const primary = result.familyPrimary;
  const accent =
    result.colorTheme.accent ||
    (primary ? BESPOKE_FAMILY_COLOR[primary] : BESPOKE_FAMILY_COLOR.woody);
  const notes = result.notesByPosition ?? {
    top: [],
    heart: [],
    base: [],
  };

  return (
    <section className="bg-paper py-16 md:py-24">
      <BandInner>
        <Urdu size="sm" tone="brass" align="start">
          {"آپ کی خوشبو"}
        </Urdu>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-16">
          <BottleGlyph
            color={accent}
            fill={1}
            glow
            className="mx-auto h-[min(52vh,420px)] w-[min(38vw,200px)] lg:mx-0"
          />
          <div className="min-w-0">
            <h1 className="font-editorial text-[clamp(36px,5vw,64px)] leading-[1.04] text-graphite">
              {result.name}
            </h1>
            {result.dedication ? (
              <p className="mt-2.5 font-editorial text-[16px] italic leading-[1.4] text-graphite-soft">
                {result.dedication}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2.5">
              {result.familyPrimary ? (
                <FamilyChip dim={result.familyPrimary} />
              ) : null}
              {result.familySecondary ? (
                <FamilyChip dim={result.familySecondary} />
              ) : null}
            </div>

            <p className="mt-6 max-w-[58ch] text-[16px] leading-[1.65] text-graphite-soft">
              {result.brief}
            </p>

            {result.whatIHeard ? (
              <p className="mt-4 max-w-[58ch] text-[14px] leading-[1.6] text-graphite-mute">
                {result.whatIHeard}
              </p>
            ) : null}

            <NotesPyramid notes={notes} />

            {error ? (
              <p className="mt-5 text-[14px] text-terra" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        {result.brewId ? (
          <BespokeBrewPurchase
            brewId={result.brewId}
            productName={result.name}
            backHref={null}
          />
        ) : (
          <p className="mt-8 text-[15px] text-graphite-soft">
            This blend is still composing. Refresh in a moment.
          </p>
        )}

        {!result.claimed ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline-paper"
              size="pill"
              className="cursor-pointer"
              disabled={busy}
              onClick={() => void saveOnly()}
            >
              {busy ? "Saving…" : "Save for later"}
            </Button>
          </div>
        ) : null}
      </BandInner>
    </section>
  );
}

function NotesPyramid({ notes }: { notes: BespokeNotesByPosition }) {
  const rows: { label: string; names: string[] }[] = [
    { label: "Opening", names: notes.top },
    { label: "Heart", names: notes.heart },
    { label: "Base", names: notes.base },
  ];
  if (rows.every((row) => row.names.length === 0)) return null;

  return (
    <div className="mt-8 max-w-[42rem] border-t border-graphite/12 pt-6">
      <p className="font-ui text-[11px] uppercase tracking-[0.16em] text-graphite-mute">
        Notes
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {row.label}
            </dt>
            <dd className="mt-1.5 font-editorial text-[17px] leading-[1.35] text-graphite">
              {row.names.length > 0 ? row.names.join(", ") : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FamilyChip({ dim }: { dim: BespokeDimension }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-graphite/15 px-3.5 py-1.5 text-[13px] text-graphite">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: BESPOKE_FAMILY_COLOR[dim] }}
      />
      {BESPOKE_DIMENSION_LABEL[dim]}
    </span>
  );
}
