"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { readLocalCartCount } from "@/lib/cart/cart-client";
import { emitCartChanged } from "@/lib/cart/cart-events";
import { cn } from "@/lib/cn";

/**
 * Signs the shop session out after a calm confirm, then returns home.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 204) {
        throw new Error("Sign out failed");
      }
      emitCartChanged({ itemCount: readLocalCartCount() });
      setOpen(false);
      toast.success("Signed out", "Come back whenever you like.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out", "Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline-paper"
        size="sm"
        disabled={signingOut}
        className={cn("cursor-pointer", className)}
        onClick={() => setOpen(true)}
      >
        Sign out
      </Button>

      <Modal
        open={open}
        title="Sign out?"
        dismissible={!signingOut}
        theme="v2"
        onClose={() => {
          if (!signingOut) setOpen(false);
        }}
        footer={
          <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
            <Button
              type="button"
              variant="ink"
              size="md"
              disabled={signingOut}
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => {
                void signOut();
              }}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={signingOut}
              className="w-full cursor-pointer text-graphite-soft sm:w-auto"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-graphite-soft">
          You’ll sign out of this device. A guest cart saved in this browser
          stays here.
        </p>
      </Modal>
    </>
  );
}
