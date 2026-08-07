"use client";

import type { ReactNode } from "react";
import {
  AdminListPendingProvider,
  useAdminListPending,
} from "@/components/admin/admin-list-pending";
import { AdminRefreshButton } from "@/components/admin/admin-refresh-button";

/**
 * Shared chrome for admin list pages: pending provider, compact title + Refresh,
 * optional primary actions row, then filters / table / pagination as children.
 */
export function AdminListShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  /** Primary actions only (e.g. New product). Filters belong in children. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AdminListPendingProvider>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>
            ) : null}
          </div>
          <AdminRefreshButton className="shrink-0 cursor-pointer" />
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {actions}
          </div>
        ) : null}

        {children}
      </div>
    </AdminListPendingProvider>
  );
}

/** Pass pending into table children rendered as RSC/client siblings. */
export function AdminListPendingGate({
  children,
}: {
  children: (isPending: boolean) => ReactNode;
}) {
  const { isPending } = useAdminListPending();
  return <>{children(isPending)}</>;
}
