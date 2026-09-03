"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BespokePerfumeCustomerResponse } from "@ishraqparfums/shared";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
} from "@ishraqparfums/shared";
import { BespokeSavedSkeleton } from "@/components/bespoke/bespoke-skeletons";
import { BandInner } from "@/components/home-v2/ui/band";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { shopFetch } from "@/lib/auth/shop-fetch";
import { cn } from "@/lib/cn";

export function BespokeSavedClient() {
  const router = useRouter();
  const [items, setItems] = useState<BespokePerfumeCustomerResponse[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [toRemove, setToRemove] =
    useState<BespokePerfumeCustomerResponse | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    const res = await shopFetch("/api/bespoke?pageSize=50");
    if (res.status === 401) {
      router.push("/login?next=/bespoke/saved");
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? "Could not load saved blends");
    }
    const data = (await res.json()) as {
      items: BespokePerfumeCustomerResponse[];
    };
    setItems(data.items);
  }, [router]);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  async function confirmRemove() {
    if (!toRemove) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await shopFetch(`/api/bespoke/${toRemove.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Could not delete");
      }
      setItems((prev) => prev?.filter((p) => p.id !== toRemove.id) ?? null);
      setToRemove(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="bg-paper py-16 md:py-24">
      <BandInner className="max-w-[760px]">
        <h1 className="font-editorial text-h2-editorial text-graphite">
          Your bespoke formulas.
        </h1>

        {error ? (
          <p className="mt-4 text-[14px] text-terra" role="alert">
            {error}
          </p>
        ) : null}

        {!items ? (
          <div className="mt-10">
            <BespokeSavedSkeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-[4px] border border-graphite/10 bg-shell px-6 py-10">
            <p className="text-[15px] leading-[1.55] text-graphite-soft">
              No formulas saved yet. Start a consultation and it lives here
              once you claim it.
            </p>
            <ButtonLink href="/bespoke/quiz" variant="ink" size="pill" className="mt-6">
              Begin the quiz
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-10 grid gap-3">
            {items.map((brew) => {
              const accent =
                brew.colorTheme.accent ||
                (brew.familyPrimary
                  ? BESPOKE_FAMILY_COLOR[brew.familyPrimary]
                  : BESPOKE_FAMILY_COLOR.woody);
              return (
                <li key={brew.id}>
                  <div
                    className={cn(
                      "flex flex-col gap-4 rounded-[4px] border border-graphite/10 bg-shell px-5 py-4 sm:flex-row sm:items-stretch",
                      "transition-colors duration-300",
                      "hover:border-terra/30",
                    )}
                  >
                    <span
                      className="hidden h-auto w-[3px] shrink-0 rounded-full sm:block"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/bespoke/brews/${brew.id}`}
                        className="font-editorial text-[22px] leading-none text-graphite underline decoration-transparent decoration-1 underline-offset-[4px] transition-colors hover:text-terra hover:decoration-terra/40"
                      >
                        {brew.name}
                      </Link>
                      <p className="mt-2 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
                        {brew.familyPrimary
                          ? BESPOKE_DIMENSION_LABEL[brew.familyPrimary]
                          : "Bespoke"}
                        {brew.familySecondary
                          ? ` · ${BESPOKE_DIMENSION_LABEL[brew.familySecondary]}`
                          : ""}
                      </p>
                      <p className="mt-2.5 line-clamp-2 text-[14px] leading-[1.55] text-graphite-soft">
                        {brew.brief}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center">
                      <ButtonLink
                        href={`/bespoke/brews/${brew.id}`}
                        variant="ink"
                        size="sm"
                      >
                        Open
                      </ButtonLink>
                      <Button
                        type="button"
                        variant="outline-paper"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setToRemove(brew)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </BandInner>

      <Modal
        open={toRemove !== null}
        title="Remove this blend?"
        dismissible={!removing}
        onClose={() => {
          if (!removing) setToRemove(null);
        }}
        footer={
          <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={removing}
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => void confirmRemove()}
            >
              {removing ? "Removing…" : "Remove"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={removing}
              className="w-full cursor-pointer text-ink-soft sm:w-auto"
              onClick={() => setToRemove(null)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {toRemove
            ? `"${toRemove.name}" will be removed from your saved blends. If it is still in a cart, that line will become unavailable at checkout.`
            : null}
        </p>
      </Modal>
    </section>
  );
}
