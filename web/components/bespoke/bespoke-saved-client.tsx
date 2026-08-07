"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BespokePerfumeCustomerResponse } from "@ishraqparfums/shared";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
} from "@ishraqparfums/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Modal } from "@/components/ui/modal";
import { BespokeSavedSkeleton } from "@/components/bespoke/bespoke-skeletons";
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
    const res = await fetch("/api/bespoke?pageSize=50");
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
      const res = await fetch(`/api/bespoke/${toRemove.id}`, {
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
    <Container size="narrow" className="py-8 sm:py-12">
      <Eyebrow>Saved</Eyebrow>
      <h1 className="font-display mt-3 text-section font-semibold text-ink">
        Your bespoke blends
      </h1>
      {error ? (
        <p className="mt-4 text-sm text-rose" role="alert">
          {error}
        </p>
      ) : null}
      {!items ? (
        <div className="mt-8">
          <BespokeSavedSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-ink/12 bg-card px-5 py-8">
          <p className="text-[15px] text-ink-soft">No saved blends yet.</p>
          <ButtonLink href="/bespoke/quiz" variant="emphasis" className="mt-5">
            Take the quiz
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
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
                    "flex flex-col gap-4 rounded-lg border border-ink/12 px-5 py-4 sm:flex-row sm:items-stretch",
                    "transition-[background-color,border-color] duration-200",
                    "hover:border-ink/25 hover:bg-card",
                  )}
                >
                  <span
                    className="hidden h-auto w-2 shrink-0 rounded-full sm:block"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/bespoke/brews/${brew.id}`}
                      className="font-display text-lg font-semibold text-ink underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors hover:decoration-ink/40"
                    >
                      {brew.name}
                    </Link>
                    <p className="mt-1 font-mono text-label-sm uppercase text-ink-faint">
                      {brew.familyPrimary
                        ? BESPOKE_DIMENSION_LABEL[brew.familyPrimary]
                        : "Bespoke"}
                      {brew.familySecondary
                        ? ` · ${BESPOKE_DIMENSION_LABEL[brew.familySecondary]}`
                        : ""}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                      {brew.brief}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center">
                    <ButtonLink
                      href={`/bespoke/brews/${brew.id}`}
                      variant="emphasis"
                      size="sm"
                    >
                      Open
                    </ButtonLink>
                    <Button
                      type="button"
                      variant="outline"
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
    </Container>
  );
}
