"use client";

import { useEffect, useState } from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { ProductReviewFields } from "@/components/product/reviews/product-review-fields";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { updateReview } from "@/lib/reviews/reviews-client";

/**
 * Edit an existing product review in a dismissible modal → PATCH /api/reviews/:id.
 *
 * Not explicitly named in the redesign plan's reviews file list, but wired in
 * by `ProductReviewsSection` (edit flow for "your review") — ported alongside
 * the rest of the reviews subsystem so that section isn't left importing a v1
 * file. Save/cancel logic unchanged, retinted.
 */
export function ProductReviewEditModal({
  open,
  review,
  onClose,
  onSaved,
}: {
  open: boolean;
  review: ReviewResponse | null;
  onClose: () => void;
  onSaved: (review: ReviewResponse) => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !review) return;
    setRating(review.rating);
    setBody(review.body ?? "");
    setSaving(false);
  }, [open, review]);

  async function onSave() {
    if (!review) return;
    setSaving(true);
    try {
      const updated = await updateReview(review.id, {
        rating,
        body: body.trim() ? body.trim() : null,
      });
      toast.success("Review updated");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(
        "Could not update review",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit your review"
      dismissible={!saving}
      onClose={onClose}
      panelClassName="max-w-lg"
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="ink"
            size="md"
            disabled={saving || !review}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onSave();
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer text-graphite-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <ProductReviewFields
        rating={rating}
        body={body}
        disabled={saving}
        onRatingChange={setRating}
        onBodyChange={setBody}
      />
    </Modal>
  );
}
