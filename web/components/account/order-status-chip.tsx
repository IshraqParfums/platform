import type { OrderStatus } from "@ishraqparfums/shared";
import { orderTone, orderStatusLabel } from "@/lib/orders/order-status";
import { cn } from "@/lib/cn";

/**
 * State of an order, at a glance.
 *
 * The label stays `text-graphite-soft` at every state — a coloured 11px
 * label on paper is a legibility problem, not a signal. The tone is carried
 * by a small dot instead, and the dot is only ever reinforcement: the words
 * already say what the colour says.
 */
const DOT: Record<ReturnType<typeof orderTone>, string> = {
  awaiting: "bg-terra",
  active: "bg-brass",
  completed: "bg-graphite",
  failed: "bg-terra-deep",
};

export function OrderStatusChip({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border border-graphite/12 px-2.5 py-1",
        "font-ui text-[11px] uppercase tracking-[0.12em] text-graphite-soft",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", DOT[orderTone(status)])}
      />
      {orderStatusLabel(status)}
    </span>
  );
}
