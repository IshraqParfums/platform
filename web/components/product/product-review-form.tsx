"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { ReviewResponse } from "@ishraqparfums/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
          ...(payload.title.trim() ? { title: payload.title.trim() } : {}),
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
    setSuccess(false);

    const draft: ReviewDraft = { slug, rating, title, body };

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
        setSuccess(true);
        setTitle("");
        setBody("");
        setRating(5);
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
        setTitle(draft.title);
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
        setTitle(draft.title);
        setBody(draft.body);
        setError(message ?? "Could not submit review");
        return;
      }
      if (review) {
        clearReviewDraft(slug);
        setSuccess(true);
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
        <h3 className="font-display text-xl font-semibold text-ink">
          Write a review
        </h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          Sign in is required to post. We’ll save your draft if you need to log
          in first.
        </p>
      </div>

      <fieldset>
        <legend className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Rating
        </legend>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                "cursor-pointer p-1 transition-colors",
                value <= rating ? "text-gold" : "text-ink/25 hover:text-ink/45",
              )}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={value === rating}
              onClick={() => setRating(value)}
            >
              <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor">
                <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Title <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <input
          type="text"
          name="title"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClassName()}
          placeholder="A few words"
        />
      </label>

      <label className="block">
        <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Review <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={cn(fieldClassName(), "resize-y")}
          placeholder="How does it wear? What notes stand out?"
        />
      </label>

      <Button
        type="submit"
        variant="emphasis"
        size="md"
        className="cursor-pointer"
        disabled={isPending}
      >
        {isPending ? "Submitting…" : "Post review"}
      </Button>

      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
      {success ? (
        <p className="text-sm text-ink-soft">Thank you — your review is live.</p>
      ) : null}
    </form>
  );
}

function fieldClassName(): string {
  return cn(
    "mt-2 w-full rounded-none border border-ink/20 bg-cream-soft px-3.5 py-3",
    "text-[15px] text-ink outline-none transition-colors",
    "placeholder:text-ink-faint focus:border-ink/45",
  );
}
