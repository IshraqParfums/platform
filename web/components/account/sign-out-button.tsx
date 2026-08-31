"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignOutDialog } from "@/components/account/sign-out-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Account-page sign out: a pill button that opens the shared confirmation.
 * Returns home on success, since the page it sits on is about to 404 the
 * moment the session is gone.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline-paper"
        size="sm"
        className={cn("cursor-pointer", className)}
        onClick={() => setOpen(true)}
      >
        Sign out
      </Button>

      <SignOutDialog
        open={open}
        onClose={() => setOpen(false)}
        onSignedOut={() => {
          setOpen(false);
          router.replace("/");
        }}
      />
    </>
  );
}
