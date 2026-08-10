"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeDimension,
  type BespokeSessionResultResponse,
} from "@ishraqparfums/shared";
import { BespokeBrewPurchase } from "@/components/bespoke/bespoke-brew-purchase";
import { BottleGlyph } from "@/components/bespoke/bottle-glyph";
import { BespokeBrewSkeleton } from "@/components/bespoke/bespoke-skeletons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { loadBespokeSessionResult } from "@/lib/bespoke/complete-session";

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

  async function ensureClaimed(): Promise<string> {
    if (result?.brewId) return result.brewId;
    const res = await fetch(`/api/bespoke/sessions/${sessionId}/claim`, {
      method: "POST",
    });
    if (res.status === 401) {
      router.push(
        `/login?next=${encodeURIComponent(`/bespoke/result/${sessionId}`)}`,
      );
      throw new Error("Login required");
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? "Could not save your blend");
    }
    const data = (await res.json()) as BespokeSessionResultResponse;
    setResult(data);
    if (!data.brewId) throw new Error("Claim did not return a brew");
    return data.brewId;
  }

  async function claimForPurchase() {
    setBusy(true);
    setError(null);
    try {
      await ensureClaimed();
    } catch (e) {
      if (e instanceof Error && e.message === "Login required") return;
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function saveOnly() {
    setBusy(true);
    setError(null);
    try {
      await ensureClaimed();
      router.push("/bespoke/saved");
    } catch (e) {
      if (e instanceof Error && e.message === "Login required") return;
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (error && !result) {
    return (
      <Container size="narrow" className="py-10">
        <p className="text-rose" role="alert">
          {error}
        </p>
        <ButtonLink href="/bespoke/quiz" variant="emphasis" className="mt-6">
          Restart the quiz
        </ButtonLink>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container size="narrow" className="py-8 sm:py-12">
        <BespokeBrewSkeleton />
      </Container>
    );
  }

  const primary = result.familyPrimary;
  const accent =
    result.colorTheme.accent ||
    (primary ? BESPOKE_FAMILY_COLOR[primary] : BESPOKE_FAMILY_COLOR.woody);

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <Eyebrow>Your blend</Eyebrow>
      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <BottleGlyph color={accent} fill={1} glow className="h-40 w-24" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold text-ink">
            {result.name}
          </h1>
          {result.dedication ? (
            <p className="mt-2 text-sm italic text-ink-soft">
              {result.dedication}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {result.familyPrimary ? (
              <FamilyChip dim={result.familyPrimary} />
            ) : null}
            {result.familySecondary ? (
              <FamilyChip dim={result.familySecondary} />
            ) : null}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            {result.brief}
          </p>
          {result.whatIHeard ? (
            <p className="mt-4 text-sm leading-relaxed text-ink/80">
              {result.whatIHeard}
            </p>
          ) : null}
          <p className="mt-4 border-l-2 border-gold/50 pl-3 text-sm italic text-ink-soft">
            {result.sampleFraming}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose" role="alert">
          {error}
        </p>
      ) : null}

      {result.brewId ? (
        <BespokeBrewPurchase
          brewId={result.brewId}
          productName={result.name}
          backHref="/bespoke/saved"
        />
      ) : (
        <div className="mt-8 rounded-lg border border-ink/12 bg-card p-5">
          <p className="text-sm text-ink-soft">
            Save this blend to your account to choose a size and add it to cart.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="emphasis"
              size="lg"
              className="cursor-pointer"
              disabled={busy}
              onClick={() => void claimForPurchase()}
            >
              {busy ? "Saving…" : "Save & choose size"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="cursor-pointer"
              disabled={busy}
              onClick={() => void saveOnly()}
            >
              Save for later
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}

function FamilyChip({ dim }: { dim: BespokeDimension }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-3 py-1 text-sm text-ink">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: BESPOKE_FAMILY_COLOR[dim] }}
      />
      {BESPOKE_DIMENSION_LABEL[dim]}
    </span>
  );
}
