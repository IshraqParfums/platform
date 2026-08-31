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
      <h1 className="font-editorial text-[clamp(28px,3.6vw,36px)] leading-[1.05] text-graphite">
        Couldn’t load your account
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
        Something went wrong on our side. Please try again in a moment.
      </p>
      <Button
        type="button"
        variant="ink"
        size="md"
        className="mt-8 cursor-pointer"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
