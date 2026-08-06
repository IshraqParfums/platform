import type { CustomerSummary } from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return "Could not load profile";
}

export async function getMe(): Promise<CustomerSummary> {
  const response = await shopFetch("/api/customers/me", { cache: "no-store" });
  if (!response.ok) throw new Error(await readErrorMessage(response));
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
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as CustomerSummary;
}
