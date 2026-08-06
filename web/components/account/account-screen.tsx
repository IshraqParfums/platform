"use client";

import { Button } from "@/components/ui/button";

/**
 * Shared failure screen for the account routes. The session rule that decides
 * when this is reached lives in `lib/auth/use-guarded-load.ts` — a signed-out
 * customer never lands here, only a genuine fault does, so retry is the offer.
 */
export function AccountError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-lg py-10">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
        Couldn’t load your account
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Something went wrong on our side. Please try again in a moment.
      </p>
      <Button
        type="button"
        variant="outline"
        size="md"
        className="mt-8 cursor-pointer"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
