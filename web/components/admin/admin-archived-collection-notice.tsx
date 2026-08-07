import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * Inline notice under a collection select when the chosen collection is archived.
 * Copy is caller-owned (create vs edit wording differs).
 */
export function AdminArchivedCollectionNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-sm text-ink-soft",
        className,
      )}
    >
      {children}
    </p>
  );
}
