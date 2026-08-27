import type { ReviewResponse } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Up to two initials from a display name (e.g. "Dayyan Ali" → "DA"). */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function ReviewAvatar({ name }: { name: string }) {
  const initials = initialsFromName(name);
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-terra/35 bg-paper-deep text-[12px] font-semibold tracking-wide text-terra"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex shrink-0 text-terra" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5"
          fill={value <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.1"
        >
          <path
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/**
 * Review card:
 * [AB] Name · date
 * Stars
 * Body
 * Verified buyer
 *
 * `mine` uses a distinct surface so the shopper’s review doesn’t blend into
 * the public list.
 */
export function ProductReviewCard({
  review,
  mine = false,
  onEdit,
  onDelete,
}: {
  review: ReviewResponse;
  mine?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article
      className={cn(
        "px-4 py-4 sm:px-5 sm:py-5",
        mine
          ? "border border-terra/30 bg-shell"
          : "border border-graphite/10 bg-paper",
      )}
    >
      <div className="flex items-center gap-2.5">
        <ReviewAvatar name={review.reviewerName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-graphite">
            {review.reviewerName}
          </p>
          {mine ? (
            <p className="text-[13px] text-terra">
              Your review
            </p>
          ) : null}
        </div>
        <time
          dateTime={review.createdAt}
          className="shrink-0 text-[13px] text-graphite-soft"
        >
          {formatReviewDate(review.createdAt)}
        </time>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <Stars rating={review.rating} />
        <span className="sr-only">{review.rating} out of 5 stars</span>
      </div>

      {review.body ? (
        <p className="mt-1.5 text-[15px] leading-relaxed text-graphite-soft">
          {review.body}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {review.isVerifiedBuyer ? (
          <p className="text-[13px] text-terra">
            Verified buyer
          </p>
        ) : null}
        {mine && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer text-[13px] text-graphite-soft transition-colors hover:text-graphite"
          >
            Edit
          </button>
        ) : null}
        {mine && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer text-[13px] text-graphite-soft transition-colors hover:text-graphite"
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}
