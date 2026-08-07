import type { OrderStatus } from "@ishraqparfums/shared";
import {
  adminOrderStatusHelp,
  adminOrderStatusLabel,
  adminOrderStatusVisual,
} from "@/lib/orders/admin-order-status";
import { HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/cn";

export function AdminOrderStatusChip({
  status,
  className,
  showHelp = false,
}: {
  status: OrderStatus;
  className?: string;
  /** Detail pages: popover help. List rows use native title instead. */
  showHelp?: boolean;
}) {
  const visual = adminOrderStatusVisual(status);
  const label = adminOrderStatusLabel(status);
  const help = adminOrderStatusHelp(status);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        title={showHelp ? undefined : help}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1",
          "font-mono text-label-sm uppercase",
          visual.chip,
        )}
      >
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", visual.dot)}
        />
        {label}
      </span>
      {showHelp ? (
        <HelpTip label={`About ${label}`}>{help}</HelpTip>
      ) : null}
    </span>
  );
}
