"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSignOut } from "@/lib/auth/use-sign-out";

/**
 * The sign-out confirmation, wherever it's asked for — the Account page
 * button and the header profile menu both open this one dialog, so the
 * question, the warning about the guest cart, and the button labels can't
 * drift into two slightly different reassurances.
 *
 * Owns only the dialog, never the trigger: the two triggers look nothing
 * alike (a pill button on paper, a row inside a dropdown) while the
 * confirmation is identical. The in-flight flag therefore stays inside — the
 * modal already covers the trigger, so no caller needs to disable it.
 */
export function SignOutDialog({
  open,
  onClose,
  onSignedOut,
}: {
  open: boolean;
  onClose: () => void;
  /** Runs after the session is gone, before the router refresh. */
  onSignedOut?: () => void;
}) {
  const { signingOut, signOut } = useSignOut(onSignedOut);

  return (
    <ConfirmDialog
      open={open}
      title="Sign out?"
      confirmLabel="Sign out"
      pendingLabel="Signing out…"
      pending={signingOut}
      onConfirm={() => {
        void signOut();
      }}
      onClose={onClose}
    >
      You’ll sign out of this device. A guest cart saved in this browser stays
      here.
    </ConfirmDialog>
  );
}
