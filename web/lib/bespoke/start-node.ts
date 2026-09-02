import "server-only";

import type { BespokeStartNodePreviewResponse } from "@ishraqparfums/shared";
import { nestFetch } from "@/lib/api/nest";
import { BESPOKE_CACHE_TAGS } from "@/lib/bespoke/bespoke-cache";

/** Same cadence as the public catalog fetches — the graph only changes on deploy. */
const BESPOKE_START_NODE_REVALIDATE_SECONDS = 300;

/**
 * Live preview of the quiz's real opening question, for the homepage
 * teaser. Falls back to `null` on any failure so the homepage degrades to
 * a generic CTA rather than showing stale or broken copy.
 */
export async function getBespokeStartNode(): Promise<BespokeStartNodePreviewResponse | null> {
  try {
    const { data } = await nestFetch<BespokeStartNodePreviewResponse>(
      "/bespoke/start-node",
      {
        next: {
          revalidate: BESPOKE_START_NODE_REVALIDATE_SECONDS,
          tags: [BESPOKE_CACHE_TAGS.startNode],
        },
      },
    );
    return data;
  } catch {
    return null;
  }
}
