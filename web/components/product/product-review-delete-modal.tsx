"use client";

import { useState } from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { deleteReview } from "@/lib/reviews/reviews-client";

/**
 * Confirm before permanently removing the shopper’s review.
 */
export function ProductReviewDeleteModal({
  open,
  review,
  onClose,
  onDeleted,
}: {
  open: boolean;
  review: ReviewResponse | null;
  onClose: () => void;
  onDeleted: (review: ReviewResponse) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function onConfirm() {
    if (!review) return;
    setDeleting(true);
    try {
      await deleteReview(review.id);
      toast.success("Review removed");
      onDeleted(review);
      onClose();
    } catch (err) {
      toast.error(
        "Could not remove review",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open && review !== null}
      title="Remove your review?"
      dismissible={!deleting}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={deleting}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onConfirm();
            }}
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={deleting}
            className="w-full cursor-pointer text-ink-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-soft">
        This permanently removes your review from this perfume. You can write a
        new one later if you like.
      </p>
    </Modal>
  );
}
