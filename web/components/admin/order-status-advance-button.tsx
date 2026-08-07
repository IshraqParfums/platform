"use client";

import type { OrderStatus } from "@ishraqparfums/shared";
import { ORDER_FULFILLMENT_SEQUENCE } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import {
  adminOrderAdvanceVerb,
  adminOrderStatusLabel,
} from "@/lib/orders/admin-order-status";

export function OrderStatusAdvanceButton({
  orderId,
  status,
  onStatusChange,
}: {
  orderId: string;
  status: OrderStatus;
  /** Optional optimistic sync for sibling chip on the same page. */
  onStatusChange?: (next: OrderStatus) => void;
}) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState(status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const currentIndex = ORDER_FULFILLMENT_SEQUENCE.indexOf(localStatus);
  const nextStatus =
    currentIndex >= 0 ? ORDER_FULFILLMENT_SEQUENCE[currentIndex + 1] : undefined;
  const actionLabel = adminOrderAdvanceVerb(localStatus);

  if (!nextStatus || !actionLabel) {
    return null;
  }

  async function advance() {
    setSubmitting(true);
    const previous = localStatus;
    // Optimistic: flip button/chip immediately; roll back on failure.
    setLocalStatus(nextStatus!);
    onStatusChange?.(nextStatus!);
    setConfirmOpen(false);

    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not update order status");
      }

      toast.success(
        `Order marked as ${adminOrderStatusLabel(nextStatus!).toLowerCase()}`,
      );
      router.refresh();
    } catch (error) {
      setLocalStatus(previous);
      onStatusChange?.(previous);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="emphasis"
        size="md"
        disabled={submitting}
        onClick={() => setConfirmOpen(true)}
        className="cursor-pointer"
      >
        {submitting ? "Updating…" : actionLabel}
      </Button>

      <Modal
        open={confirmOpen}
        title={actionLabel}
        onClose={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={submitting}
              onClick={() => void advance()}
              className="cursor-pointer"
            >
              {submitting ? "Updating…" : actionLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Move this order to{" "}
          <span className="font-medium text-ink">
            {adminOrderStatusLabel(nextStatus)}
          </span>
          ?
        </p>
      </Modal>
    </>
  );
}
