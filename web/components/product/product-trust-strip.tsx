import { Lock, RotateCcw, Truck } from "lucide-react";

const TRUST_ITEMS = [
  {
    id: "secure",
    label: "Secure checkout",
    Icon: Lock,
  },
  {
    id: "shipping",
    label: "₹50 delivery",
    Icon: Truck,
  },
  {
    id: "returns",
    label: "7-day support",
    Icon: RotateCcw,
  },
] as const;

/**
 * Compact PDP assurances under the primary CTA — one job, three signals.
 */
export function ProductTrustStrip() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1">
      {TRUST_ITEMS.map(({ id, label, Icon }) => (
        <li
          key={id}
          className="inline-flex items-center gap-1.5 font-mono text-label-sm tracking-wide text-ink-faint"
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-ink-soft"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
