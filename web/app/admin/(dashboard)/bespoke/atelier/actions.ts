/**
 * Client-side accord search/load, against the proxy routes under
 * /api/admin/bespoke/atelier/accords — which forward to the Nest
 * AdminBespokeAtelierController. In Bespoke's original prototype these were
 * Next.js server actions reading data/accords.json directly; here the data
 * lives behind the API, so the same two calls go through fetch instead.
 *
 * accords.json is 3.3 MB and the Atelier needs one formula at a time, so — as
 * in the original — the accord library never crosses the wire in bulk: only
 * a name/id/note/family search, and a single accord's formula on load.
 */

import type { AtelierAccordSummary, AtelierLoadedAccord } from "@ishraqparfums/shared";
import { adminFetch } from "@/lib/auth/admin-fetch";

export type AccordSummary = AtelierAccordSummary;
export type LoadedAccord = AtelierLoadedAccord;

export async function searchAccords(query: string): Promise<AccordSummary[]> {
  const res = await adminFetch(`/api/admin/bespoke/atelier/accords?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return (await res.json()) as AccordSummary[];
}

export async function loadAccord(id: string): Promise<LoadedAccord | null> {
  const res = await adminFetch(`/api/admin/bespoke/atelier/accords/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as LoadedAccord;
}
