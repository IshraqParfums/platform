import type { CustomerSummary } from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";

export async function getMe(): Promise<CustomerSummary> {
  const response = await shopFetch("/api/customers/me", { cache: "no-store" });
  if (!response.ok) throw await apiErrorFrom(response, "Could not load profile");
  return (await response.json()) as CustomerSummary;
}

export async function updateMe(input: {
  name: string;
  email: string;
}): Promise<CustomerSummary> {
  const response = await shopFetch("/api/customers/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
    }),
  });
  if (!response.ok) throw await apiErrorFrom(response, "Could not load profile");
  return (await response.json()) as CustomerSummary;
}
