/**
 * `localStorage`/`sessionStorage` access wrapped in try/catch. Safari
 * private browsing, storage-blocked browser settings, and a full quota all
 * throw synchronously on `getItem`/`setItem`/`removeItem` rather than
 * failing gracefully — losing persistence for a call site is survivable, an
 * uncaught throw taking down the calling flow is not.
 *
 * The same pattern was independently reimplemented in `atelier-storage.ts`
 * and `guest-cart-hint.ts` (both correct) before two more call sites turned
 * out to be missing it entirely (`review-draft.ts`, `guest-cart.ts`'s
 * `writeGuestCart`) — this is the shared version those two now use, rather
 * than a fourth and fifth copy.
 *
 * `typeof window === "undefined"` is checked before any reference to
 * `window.localStorage`/`window.sessionStorage`, not a bare `localStorage`/
 * `sessionStorage` identifier — the bare globals aren't defined during SSR
 * and would throw a `ReferenceError` before the try/catch ever ran.
 *
 * Accessing the Storage object itself also throws in some privacy / blocked-
 * storage modes (Safari, Firefox). That has to be inside try/catch too —
 * wrapping only getItem/setItem/removeItem is not enough.
 */
export type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function safeStorageGet(kind: StorageKind, key: string): string | null {
  const storage = getStorage(kind);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(
  kind: StorageKind,
  key: string,
  value: string,
): void {
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / quota exceeded — losing persistence is survivable */
  }
}

export function safeStorageRemove(kind: StorageKind, key: string): void {
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}
