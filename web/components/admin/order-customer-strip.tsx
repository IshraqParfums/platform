import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Compact customer identity above order items — name + contacts + profile link.
 */
export function OrderCustomerStrip({
  customerId,
  name,
  email,
  phone,
  className,
}: {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
        "rounded-lg border border-ink/10 bg-card px-4 py-2.5",
        className,
      )}
    >
      <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-ink">{name}</span>
        <span className="text-ink-faint" aria-hidden>
          ·
        </span>
        <a
          href={`mailto:${email}`}
          className="truncate text-ink-soft underline decoration-transparent underline-offset-2 hover:decoration-ink/30"
        >
          {email}
        </a>
        <span className="text-ink-faint" aria-hidden>
          ·
        </span>
        <a
          href={`tel:${phone}`}
          className="text-ink-soft underline decoration-transparent underline-offset-2 hover:decoration-ink/30"
        >
          {phone}
        </a>
      </div>
      <Link
        href={`/admin/customers/${customerId}`}
        className={cn(
          "group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink-soft",
          "underline decoration-transparent decoration-1 underline-offset-4",
          "transition-colors duration-200 hover:text-ink hover:decoration-ink/35",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30",
        )}
      >
        Customer profile
        <ChevronRight
          className="size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
