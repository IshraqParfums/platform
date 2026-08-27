import { cn } from "@/lib/cn";

/**
 * Elbow starts at the specimen’s mid-height and rises into the caption —
 * matches the journal sketch:  ____ details   /  details ____
 *                              /                  \
 */
export function ElbowLine({
  side,
  className,
}: {
  side: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 56"
      className={cn(
        "mt-10 h-[52px] w-[56px] shrink-0 text-graphite/45 sm:mt-12 sm:h-[56px] sm:w-[60px]",
        side === "left" && "-scale-x-100",
        className,
      )}
    >
      <path
        d="M2 52 L22 8 H62"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="nonScalingStroke"
      />
    </svg>
  );
}

export function MaterialCopy({
  name,
  role,
  notes,
  blurb,
  align,
  className,
}: {
  name: string;
  role: string;
  notes: string;
  blurb: string;
  align: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 text-graphite",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-terra">{role}</p>
      <p className="mt-1 font-editorial text-[28px] leading-none tracking-[-0.02em] sm:text-[32px]">
        {name}
      </p>
      <p className="mt-2 text-[12px] tracking-[0.01em] text-graphite-soft sm:text-[13px]">
        {notes}
      </p>
      <p
        className={cn(
          "mt-2 max-w-[28ch] text-[13px] leading-[1.45] text-graphite-soft sm:text-[14px]",
          align === "right" && "ml-auto",
        )}
      >
        {blurb}
      </p>
    </div>
  );
}
