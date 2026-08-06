import type { CustomerSummary } from "@ishraqparfums/shared";

/** True when the shopper has name + email saved for receipts / checkout. */
export function isProfileComplete(
  me: Pick<CustomerSummary, "name" | "email"> | null | undefined,
): boolean {
  if (!me) return false;
  return Boolean(me.name?.trim() && me.email?.trim());
}
