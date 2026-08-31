import { readLocalCartCount } from "@/lib/cart/cart-client";
import { emitCartChanged } from "@/lib/cart/cart-events";

/**
 * Ends the shop session and syncs the cart badge back to whatever a guest
 * cart holds. Pure action, no UI: `useSignOut` adds the pending flag, toasts
 * and router refresh, and `SignOutDialog` puts the confirmation in front of
 * it for both the Account page and the header menu.
 */
export async function signOutShopSession(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 204) {
    throw new Error("Sign out failed");
  }
  emitCartChanged({ itemCount: readLocalCartCount() });
}
