/**
 * Empty community column — copy + desktop stroke illustration
 * (open review card + empty stars) to balance the write / yours column.
 */
export function ProductReviewsEmpty({
  variant = "none",
}: {
  /** `none` = no reviews at all; `only-yours` = shopper has one, community is empty. */
  variant?: "none" | "only-yours";
}) {
  return (
    <div className="flex max-w-md flex-col lg:min-h-[22rem]">
      <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
        {variant === "only-yours" ? "No other reviews yet" : "No reviews yet"}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {variant === "only-yours"
          ? "Yours is the first. When others share how it wears, they’ll show up here."
          : "Be the first to share how it wears — notes, projection, and how it settles on skin. Your words help the next person choose with confidence."}
      </p>

      <div className="mt-8 hidden flex-1 items-center justify-center lg:flex">
        <EmptyReviewsMark />
      </div>
    </div>
  );
}

/**
 * Large stroke illustration: open review card + empty stars.
 * Desktop filler so an empty community column doesn’t look hollow.
 */
function EmptyReviewsMark() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="h-44 w-auto text-ink/20 xl:h-48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="28"
        y="36"
        width="144"
        height="100"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M140 36v28h28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M140 36l28 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <g transform="translate(48 62)" stroke="currentColor" strokeWidth="1.4">
        <StarOutline x={0} />
        <StarOutline x={26} />
        <StarOutline x={52} />
        <StarOutline x={78} />
        <StarOutline x={104} />
      </g>

      <line
        x1="48"
        y1="98"
        x2="152"
        y2="98"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <line
        x1="48"
        y1="112"
        x2="128"
        y2="112"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />

      <g transform="translate(86 4)" stroke="currentColor" strokeWidth="1.6">
        <path
          d="M14 2.2l3.4 6.9 7.6 1.1-5.5 5.35 1.3 7.55L14 19.5l-6.8 3.6 1.3-7.55-5.5-5.35 7.6-1.1z"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function StarOutline({ x }: { x: number }) {
  return (
    <path
      transform={`translate(${x} 0)`}
      d="M10 1.4l2.3 4.65 5.15.75-3.75 3.65.9 5.15L10 13.2l-4.6 2.4.9-5.15-3.75-3.65 5.15-.75z"
      strokeLinejoin="round"
    />
  );
}
