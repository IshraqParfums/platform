"use client";

import { cn } from "@/lib/cn";

/**
 * Shared rating / title / body controls for create form and edit modal.
 */
export function ProductReviewFields({
  rating,
  title,
  body,
  disabled,
  onRatingChange,
  onTitleChange,
  onBodyChange,
}: {
  rating: number;
  title: string;
  body: string;
  disabled?: boolean;
  onRatingChange: (rating: number) => void;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
}) {
  return (
    <div className="space-y-3.5">
      <fieldset disabled={disabled}>
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
                disabled && "cursor-not-allowed opacity-55",
              )}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={value === rating}
              disabled={disabled}
              onClick={() => onRatingChange(value)}
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
          disabled={disabled}
          onChange={(event) => onTitleChange(event.target.value)}
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
          disabled={disabled}
          onChange={(event) => onBodyChange(event.target.value)}
          className={cn(fieldClassName(), "resize-y")}
          placeholder="How does it wear? What notes stand out?"
        />
      </label>
    </div>
  );
}

function fieldClassName(): string {
  return cn(
    "mt-2 w-full rounded-none border border-ink/20 bg-cream-soft px-3.5 py-3",
    "text-[15px] text-ink outline-none transition-colors",
    "placeholder:text-ink-faint focus:border-ink/45",
    "disabled:cursor-not-allowed disabled:opacity-55",
  );
}
