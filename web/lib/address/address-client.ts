import type {
  AddressResponse,
  CreateAddressBody,
  UpdateAddressBody,
} from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";

export async function listAddresses(): Promise<AddressResponse[]> {
  const response = await shopFetch("/api/customers/addresses", {
    cache: "no-store",
  });
  if (!response.ok) throw await apiErrorFrom(response);
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
  if (!response.ok) throw await apiErrorFrom(response);
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
  if (!response.ok) throw await apiErrorFrom(response);
  return (await response.json()) as AddressResponse;
}

export async function deleteAddress(id: string): Promise<void> {
  const response = await shopFetch(
    `/api/customers/addresses/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 204) {
    throw await apiErrorFrom(response);
  }
}
