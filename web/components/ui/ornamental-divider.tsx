import { cn } from "@/lib/cn";

/**
 * Hairline arms + center diamond flanked by elongated lozenges.
 * Stroke-based so it stays crisp at small sizes.
 */
export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "mx-auto block h-3 w-full max-w-[12rem] text-ink-faint/85",
        className,
      )}
    >
      <path
        d="M2 6h92"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M186 6h92"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Left lozenge */}
      <path
        d="M100 6 L118 3.2 L134 6 L118 8.8 Z"
        fill="currentColor"
      />

      {/* Right lozenge */}
      <path
        d="M180 6 L162 3.2 L146 6 L162 8.8 Z"
        fill="currentColor"
      />

      {/* Center diamond */}
      <path d="M140 2.4 L145.2 6 L140 9.6 L134.8 6 Z" fill="currentColor" />
    </svg>
  );
}
