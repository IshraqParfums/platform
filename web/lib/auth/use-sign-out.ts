"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/toaster";
import { signOutShopSession } from "@/lib/auth/sign-out";

/**
 * The sign-out *interaction* — pending flag, toasts, and the refresh that
 * repaints server components now rendering as a guest.
 *
 * `signOutShopSession` is the bare fetch; this is everything every caller
 * then has to remember around it. The pending flag stays `true` on success
 * on purpose: a refresh or redirect is already in flight, so re-enabling the
 * button would only offer a second, pointless sign-out during the frames
 * before the surface goes away. It is cleared on failure, where retrying is
 * exactly what the user wants.
 *
 * Surface-specific epilogue (redirect home, collapse a menu) goes in
 * `onSignedOut`; it runs before the refresh so a `router.replace` and the
 * refresh coalesce into one navigation.
 */
export function useSignOut(onSignedOut?: () => void) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await signOutShopSession();
      onSignedOut?.();
      toast.success("Signed out", "Come back whenever you like.");
      router.refresh();
    } catch {
      toast.error("Could not sign out", "Please try again.");
      setSigningOut(false);
    }
  }

  return { signingOut, signOut };
}
