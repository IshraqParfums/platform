import type {
  AddressResponse,
  CreateAddressBody,
  UpdateAddressBody,
} from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return "Something went wrong";
}

export async function listAddresses(): Promise<AddressResponse[]> {
  const response = await shopFetch("/api/customers/addresses", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as AddressResponse[];
}

export async function createAddress(
  body: CreateAddressBody,
): Promise<AddressResponse> {
  const response = await shopFetch("/api/customers/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as AddressResponse;
}

export async function updateAddress(
  id: string,
  body: UpdateAddressBody,
): Promise<AddressResponse> {
  const response = await shopFetch(
    `/api/customers/addresses/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as AddressResponse;
}

export async function deleteAddress(id: string): Promise<void> {
  const response = await shopFetch(
    `/api/customers/addresses/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 204) {
    throw new Error(await readErrorMessage(response));
  }
}
