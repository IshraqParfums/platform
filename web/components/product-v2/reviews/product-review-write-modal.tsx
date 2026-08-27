"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { ProductReviewFields } from "@/components/product-v2/reviews/product-review-fields";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import {
  clearReviewDraft,
  saveReviewDraft,
} from "@/lib/reviews/review-draft";
import {
  createProductReview,
  updateReview,
} from "@/lib/reviews/reviews-client";

/**
 * Create or edit a review. Stars required; written text optional.
 * Unsigned create saves a draft and sends the shopper to login.
 */
export function ProductReviewWriteModal({
  open,
  slug,
  review,
  onClose,
  onCreated,
  onSaved,
}: {
  open: boolean;
  slug: string;
  review: ReviewResponse | null;
  onClose: () => void;
  onCreated: (review: ReviewResponse) => void;
  onSaved: (review: ReviewResponse) => void;
}) {
  const router = useRouter();
  const editing = review !== null;
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(review?.rating ?? 5);
    setBody(review?.body ?? "");
    setSaving(false);
    setError(null);
  }, [open, review]);

  function redirectToLogin() {
    saveReviewDraft({ slug, rating, body });
    const next = `/products/${slug}#reviews`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  async function onSubmit() {
    setSaving(true);
    setError(null);

    if (editing) {
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
      return;
    }

    const created = await createProductReview({
      slug,
      rating,
      body,
    });

    if (created.result === "unauthorized") {
      redirectToLogin();
      return;
    }
    if (created.result === "conflict") {
      clearReviewDraft(slug);
      setError("You’ve already reviewed this perfume.");
      setSaving(false);
      return;
    }
    if (created.result === "error") {
      setError(created.message ?? "Could not submit review");
      setSaving(false);
      return;
    }
    clearReviewDraft(slug);
    toast.success("Review posted");
    onCreated(created.review);
    onClose();
    setSaving(false);
  }

  return (
    <Modal
      open={open}
      title={editing ? "Edit your review" : "Write a review"}
      dismissible={!saving}
      onClose={onClose}
      panelClassName="max-w-lg"
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="ink"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onSubmit();
            }}
          >
            {saving
              ? editing
                ? "Saving…"
                : "Posting…"
              : editing
                ? "Save changes"
                : "Post review"}
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
      {!editing ? (
        <p className="mb-4 text-sm text-graphite-soft">
          Sign in is required to post. We’ll save your draft if you need to log
          in first.
        </p>
      ) : null}
      <ProductReviewFields
        rating={rating}
        body={body}
        disabled={saving}
        onRatingChange={setRating}
        onBodyChange={setBody}
      />
      {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
    </Modal>
  );
}
