import type { HealthResponse } from "@ishraqparfums/shared";
import { getNestApiBaseUrl } from "@/lib/config";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getNestApiBaseUrl()}/api/v1/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
