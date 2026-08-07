"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeDimension,
  type BespokePerfumeCustomerResponse,
} from "@ishraqparfums/shared";
import { BespokeBrewPurchase } from "@/components/bespoke/bespoke-brew-purchase";
import { BespokeBrewSkeleton } from "@/components/bespoke/bespoke-skeletons";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export function BespokeBrewClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [brew, setBrew] = useState<BespokePerfumeCustomerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/bespoke/${id}`);
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/bespoke/brews/${id}`)}`);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        if (!cancelled) {
          setError(body.message ?? "Blend not found");
        }
        return;
      }
      const data = (await res.json()) as BespokePerfumeCustomerResponse;
      if (!cancelled) setBrew(data);
    })().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Could not load blend");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (error && !brew) {
    return (
      <Container size="narrow" className="py-10">
        <p className="text-rose" role="alert">
          {error}
        </p>
        <ButtonLink href="/bespoke/saved" variant="outline" className="mt-6">
          Back to saved
        </ButtonLink>
      </Container>
    );
  }

  if (!brew) {
    return (
      <Container size="narrow" className="py-8 sm:py-12">
        <BespokeBrewSkeleton />
      </Container>
    );
  }

  const primary = brew.familyPrimary;
  const accent =
    brew.colorTheme.accent ||
    (primary ? BESPOKE_FAMILY_COLOR[primary] : BESPOKE_FAMILY_COLOR.woody);

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <Eyebrow>Saved blend</Eyebrow>
      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <div
          className="h-40 w-24 shrink-0 rounded-[45%] border border-ink/12 shadow-inner"
          style={{
            background: `linear-gradient(180deg, ${accent}66 0%, ${accent} 75%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold text-ink">
            {brew.name}
          </h1>
          {brew.dedication ? (
            <p className="mt-2 text-sm italic text-ink-soft">{brew.dedication}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {brew.familyPrimary ? (
              <FamilyChip dim={brew.familyPrimary} />
            ) : null}
            {brew.familySecondary ? (
              <FamilyChip dim={brew.familySecondary} />
            ) : null}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            {brew.brief}
          </p>
          {brew.whatIHeard ? (
            <p className="mt-4 text-sm leading-relaxed text-ink/80">
              {brew.whatIHeard}
            </p>
          ) : null}
          <p className="mt-4 border-l-2 border-gold/50 pl-3 text-sm italic text-ink-soft">
            {brew.sampleFraming}
          </p>
        </div>
      </div>

      <BespokeBrewPurchase brewId={brew.id} productName={brew.name} />
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
