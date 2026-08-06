const GUEST_CART_HINT_KEY = "ishraq_guest_cart_hint_seen";

/** Whether the guest “saved on this device” modal has been shown before. */
export function hasSeenGuestCartHint(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(GUEST_CART_HINT_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGuestCartHintSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_CART_HINT_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
