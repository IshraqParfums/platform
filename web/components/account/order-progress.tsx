import type { OrderStatus } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";

const STEPS = ["Confirmed", "In production", "Dispatched", "Delivered"] as const;

/**
 * Where the order has reached, derived purely from its status — we hold no
 * per-step timestamps, so this states position in a known sequence and claims
 * nothing about when each step happened.
 *
 * Only the fulfilment path has a sequence. An unpaid, failed or held order is
 * not "0% of the way to delivered", so those return null and the status chip
 * speaks for them instead.
 */
function stepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "ORDER_RECEIVED":
    case "CONFIRMED":
      return 0;
    case "IN_PRODUCTION":
    case "READY_FOR_DISPATCH":
      return 1;
    case "DISPATCHED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return null;
  }
}

export function OrderProgress({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const current = stepIndex(status);
  if (current === null) return null;

  return (
    <nav aria-label="Order progress" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 sm:gap-x-3">
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-1.5 sm:gap-3"
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-3 shrink-0 sm:w-8",
                    done || active ? "bg-ink/25" : "bg-ink/12",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full bg-gold transition-opacity duration-300",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <span
                className={cn(
                  "font-mono text-label-sm uppercase",
                  active
                    ? "text-ink"
                    : done
                      ? "text-ink-soft"
                      : "text-ink-faint/70",
                )}
              >
                {label}
                {done ? <span className="sr-only"> — done</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
