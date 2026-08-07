"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-faint">
          This admin page could not load. You can try again, or go back to the
          dashboard.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="emphasis"
          size="md"
          onClick={() => reset()}
          className="cursor-pointer"
        >
          Try again
        </Button>
        <ButtonLink variant="outline" size="md" href="/admin">
          Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
