/** Account IA, in one place so links, gates and redirects cannot drift apart. */
export const ACCOUNT_HOME = "/account";
export const ACCOUNT_ORDERS = "/account/orders";

/**
 * `justPlaced` marks an arrival straight from checkout, which is the only way
 * the order page can tell a fresh order from one being looked up months later.
 */
export function accountOrderPath(
  orderId: string,
  options?: { justPlaced?: boolean },
): string {
  const path = `${ACCOUNT_ORDERS}/${encodeURIComponent(orderId)}`;
  return options?.justPlaced ? `${path}?placed=1` : path;
}

/** Sign-in URL that returns the customer to where they were headed. */
export function loginPath(next: string = ACCOUNT_HOME): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
