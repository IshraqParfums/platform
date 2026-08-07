"use client";

import type { ProductArchiveReason, ProductStatus } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import {
  adminProductStatusHelp,
  adminProductStatusLabel,
  legalNextProductStatuses,
} from "@/lib/admin/product-status";

type StatusActionTarget = Extract<ProductStatus, "ACTIVE" | "DELETED">;

/**
 * Compact status card — actions driven by shared legalNextProductStatuses.
 * ARCHIVED shows restore/move guidance plus Delete when allowed.
 */
export function ProductStatusActions({
  productId,
  status: statusProp,
  archiveReason,
}: {
  productId: string;
  status: ProductStatus;
  archiveReason?: ProductArchiveReason | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(statusProp);
  const [pending, setPending] = useState<StatusActionTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    setStatus(statusProp);
  }, [statusProp]);

  const nextStatuses = useMemo(
    () => legalNextProductStatuses(status),
    [status],
  );
  const canActivate = nextStatuses.includes("ACTIVE");
  const canDelete = nextStatuses.includes("DELETED");
  const isDeleted = status === "DELETED";
  const isArchived = status === "ARCHIVED";

  useEffect(() => {
    if (pending !== "DELETED") {
      setCartCount(null);
      return;
    }

    let cancelled = false;
    setCartLoading(true);
    setCartCount(null);

    void (async () => {
      try {
        const response = await adminFetch(
          `/api/admin/products/${productId}/cart-impact`,
        );
        if (!response.ok) throw new Error("Could not load cart impact");
        const data = (await response.json()) as { cartCount: number };
        if (!cancelled) setCartCount(data.cartCount);
      } catch {
        if (!cancelled) setCartCount(null);
      } finally {
        if (!cancelled) setCartLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pending, productId]);

  async function confirm() {
    if (!pending) return;
    const next = pending;
    setSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not update status");
      }

      setStatus(next);
      setPending(null);
      toast.success(
        next === "ACTIVE"
          ? "Product activated"
          : `Status set to ${adminProductStatusLabel(next)}`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Status</h2>

      <p className="mt-2 text-sm text-ink-soft">
        Current:{" "}
        <span className="font-medium text-ink">
          {adminProductStatusLabel(status)}
        </span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        {adminProductStatusHelp(status)}
      </p>

      {isDeleted ? (
        <p className="mt-4 rounded-md border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
          This product is deleted and read-only. Status cannot be changed.
        </p>
      ) : null}

      {isArchived ? (
        <p className="mt-4 rounded-md border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
          {archiveReason === "COLLECTION"
            ? "This product was archived because its collection was archived. Restore that collection, or move this product to an active collection in Details below."
            : "This product is archived by the system. Restore its collection, or move it to an active collection in Details below."}
        </p>
      ) : null}

      {canActivate || canDelete ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {canActivate ? (
            <Button
              type="button"
              variant="emphasis"
              size="sm"
              disabled={submitting}
              className="cursor-pointer"
              onClick={() => setPending("ACTIVE")}
            >
              Activate
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              className="cursor-pointer"
              onClick={() => setPending("DELETED")}
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={pending !== null}
        title={
          pending === "ACTIVE"
            ? "Activate product"
            : pending === "DELETED"
              ? "Delete product"
              : ""
        }
        onClose={() => {
          if (!submitting) setPending(null);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={submitting}
              onClick={() => setPending(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={submitting}
              onClick={() => void confirm()}
              className="cursor-pointer"
            >
              {submitting
                ? "Updating…"
                : pending === "ACTIVE"
                  ? "Activate"
                  : "Delete"}
            </Button>
          </div>
        }
      >
        {pending === "ACTIVE" ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            This will make the product live in the shop. It needs at least one
            available size with stock and one image.
          </p>
        ) : null}
        {pending === "DELETED" ? (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              {adminProductStatusHelp("DELETED")}
            </p>
            {cartLoading ? (
              <p className="mt-3 text-sm text-ink-faint">
                Checking customer carts…
              </p>
            ) : cartCount != null ? (
              <p className="mt-3 text-sm text-ink-soft">
                In{" "}
                <span className="font-medium text-ink">{cartCount}</span>{" "}
                customer {cartCount === 1 ? "cart" : "carts"} right now.
              </p>
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  );
}
