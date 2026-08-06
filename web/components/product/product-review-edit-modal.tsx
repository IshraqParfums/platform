"use client";

import { useEffect, useState } from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { ProductReviewFields } from "@/components/product/product-review-fields";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { updateReview } from "@/lib/reviews/reviews-client";

/**
 * Edit an existing product review in a dismissible modal → PATCH /api/reviews/:id.
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !review) return;
    setRating(review.rating);
    setTitle(review.title ?? "");
    setBody(review.body ?? "");
    setSaving(false);
  }, [open, review]);

  async function onSave() {
    if (!review) return;
    setSaving(true);
    try {
      const updated = await updateReview(review.id, {
        rating,
        title: title.trim() ? title.trim() : null,
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
            variant="emphasis"
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
            className="w-full cursor-pointer text-ink-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <ProductReviewFields
        rating={rating}
        title={title}
        body={body}
        disabled={saving}
        onRatingChange={setRating}
        onTitleChange={setTitle}
        onBodyChange={setBody}
      />
    </Modal>
  );
}
