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
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-terra/35 bg-paper text-[12px] font-semibold tracking-wide text-terra"
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
 * Who, then what they said — name and stars introduce the quote.
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
    <article className={cn("py-6 md:py-7", mine && "bg-shell -mx-4 px-4 sm:-mx-5 sm:px-5")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ReviewAvatar name={review.reviewerName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-graphite">
            {review.reviewerName}
            {mine ? (
              <span className="ml-2 font-normal text-terra">Your review</span>
            ) : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Stars rating={review.rating} />
            <span className="sr-only">{review.rating} out of 5 stars</span>
            <time
              dateTime={review.createdAt}
              className="text-[13px] text-graphite-soft"
            >
              {formatReviewDate(review.createdAt)}
            </time>
            {review.isVerifiedBuyer ? (
              <p className="text-[13px] text-terra">Verified buyer</p>
            ) : null}
          </div>
        </div>
        {mine && (onEdit || onDelete) ? (
          <div className="flex shrink-0 gap-3">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="cursor-pointer text-[13px] text-graphite-soft transition-colors hover:text-graphite"
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer text-[13px] text-graphite-soft transition-colors hover:text-graphite"
              >
                Remove
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {review.body ? (
        <p className="mt-4 font-editorial text-[17px] italic leading-[1.6] text-graphite">
          {review.body}
        </p>
      ) : null}
    </article>
  );
}
