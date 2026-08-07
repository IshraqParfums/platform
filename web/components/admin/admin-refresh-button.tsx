"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function AdminRefreshButton({
  className,
}: {
  className?: string;
}) {
  const { isPending, refresh } = useAdminListPending();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-label="Refresh"
      className={cn(
        "cursor-pointer !px-2.5 sm:!px-4",
        className,
      )}
      onClick={() => refresh()}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="size-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}
