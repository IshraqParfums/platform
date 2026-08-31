/**
 * Empty reviews: invite, no illustration, no inline form.
 */
export function ProductReviewsEmpty() {
  return (
    <div className="max-w-[54ch]">
      <p className="font-editorial text-2xl text-graphite">
        Be the first to review.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
        Share how it wears: notes, projection, and how it settles on skin.
      </p>
    </div>
  );
}
