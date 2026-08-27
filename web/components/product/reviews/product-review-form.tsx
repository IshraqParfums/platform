"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { ProductReviewFields } from "@/components/product/reviews/product-review-fields";
import { Button } from "@/components/ui/button";
import {
  clearReviewDraft,
  readReviewDraft,
  saveReviewDraft,
  type ReviewDraft,
} from "@/lib/reviews/review-draft";

type SubmitResult = "ok" | "unauthorized" | "conflict" | "error";

/** Prevents Strict Mode double auto-submit for the same slug in one session. */
const resumedDraftSlugs = new Set<string>();

/**
 * Write a review. On 401, saves a draft and sends the shopper to login with
 * `?next=` back to this product’s reviews anchor; after login, auto-submits once.
 *
 * Ported from product/product-review-form.tsx: draft/submit/auto-resume
 * logic unchanged, retinted.
 */
export function ProductReviewForm({
  slug,
  onCreated,
}: {
  slug: string;
  onCreated: (review: ReviewResponse) => void;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function postReview(payload: ReviewDraft): Promise<{
    result: SubmitResult;
    review?: ReviewResponse;
    message?: string;
  }> {
    const response = await fetch(
      `/api/products/${encodeURIComponent(payload.slug)}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: payload.rating,
          ...(payload.body.trim() ? { body: payload.body.trim() } : {}),
        }),
      },
    );

    if (response.status === 401) return { result: "unauthorized" };
    if (response.status === 409) return { result: "conflict" };

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      return {
        result: "error",
        message: Array.isArray(data.message)
          ? data.message.join(" ")
          : (data.message ?? "Could not submit review"),
      };
    }

    const review = (await response.json()) as ReviewResponse;
    return { result: "ok", review };
  }

  function redirectToLogin(draft: ReviewDraft) {
    saveReviewDraft(draft);
    const next = `/products/${slug}#reviews`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const draft: ReviewDraft = { slug, rating, body };

    startTransition(async () => {
      const { result, review, message } = await postReview(draft);
      if (result === "unauthorized") {
        redirectToLogin(draft);
        return;
      }
      if (result === "conflict") {
        clearReviewDraft(slug);
        setError("You’ve already reviewed this perfume.");
        return;
      }
      if (result === "error") {
        setError(message ?? "Could not submit review");
        return;
      }
      if (review) {
        clearReviewDraft(slug);
        onCreated(review);
      }
    });
  }

  useEffect(() => {
    const draft = readReviewDraft(slug);
    if (!draft || resumedDraftSlugs.has(slug)) return;
    resumedDraftSlugs.add(slug);

    let cancelled = false;

    void (async () => {
      const { result, review, message } = await postReview(draft);
      if (cancelled) return;

      if (result === "unauthorized") {
        resumedDraftSlugs.delete(slug);
        setRating(draft.rating);
        setBody(draft.body);
        return;
      }
      if (result === "conflict") {
        clearReviewDraft(slug);
        setError("You’ve already reviewed this perfume.");
        return;
      }
      if (result === "error") {
        resumedDraftSlugs.delete(slug);
        setRating(draft.rating);
        setBody(draft.body);
        setError(message ?? "Could not submit review");
        return;
      }
      if (review) {
        clearReviewDraft(slug);
        onCreated(review);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, onCreated]);

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <h3 className="font-editorial text-xl text-graphite">
          Write a review
        </h3>
        <p className="mt-1.5 text-sm text-graphite-soft">
          Sign in is required to post. We’ll save your draft if you need to log
          in first.
        </p>
      </div>

      <ProductReviewFields
        rating={rating}
        body={body}
        disabled={isPending}
        onRatingChange={setRating}
        onBodyChange={setBody}
      />

      <Button
        type="submit"
        variant="ink"
        size="md"
        className="cursor-pointer"
        disabled={isPending}
      >
        {isPending ? "Submitting…" : "Post review"}
      </Button>

      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
    </form>
  );
}
