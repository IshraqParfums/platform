/**
 * Cache tag for the public bespoke start-node preview fetch.
 * No admin/deploy hook busts this yet (the graph ships as a static file with
 * the API, not edited via an admin UI) — defined now so the cache is
 * instantly bustable the moment such a hook exists.
 */
export const BESPOKE_CACHE_TAGS = {
  startNode: "bespoke:start-node",
} as const;
