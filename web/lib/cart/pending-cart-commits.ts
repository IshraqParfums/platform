/**
 * Deferred cart writes (soft-remove) that must land before checkout.
 *
 * Soft-remove keeps Undo by delaying the server/guest delete until the toast
 * settles. Checkout needs the truth earlier: call `flushPendingCartCommits`
 * before navigating so Nest never builds an order from lines the UI already hid.
 */

import { toast } from "@/components/ui/toaster";

type PendingCartCommit = {
  run: () => Promise<void>;
  toastId?: string | number;
};

const pending = new Map<string, PendingCartCommit>();

export function registerPendingCartCommit(
  id: string,
  run: () => Promise<void>,
  toastId?: string | number,
): void {
  pending.set(id, { run, toastId });
}

export function cancelPendingCartCommit(id: string): void {
  pending.delete(id);
}

/**
 * Run one deferred commit if it is still pending (toast dismiss path).
 * No-op when already flushed or cancelled.
 */
export async function runPendingCartCommit(id: string): Promise<void> {
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  await entry.run();
}

export function hasPendingCartCommits(): boolean {
  return pending.size > 0;
}

/**
 * Drain every deferred cart write. Safe to call when none are pending.
 * Toast dismiss handlers that race this become no-ops.
 */
export async function flushPendingCartCommits(): Promise<void> {
  if (pending.size === 0) return;

  const entries = [...pending.values()];
  pending.clear();

  for (const entry of entries) {
    if (entry.toastId !== undefined) {
      toast.dismiss(entry.toastId);
    }
  }

  await Promise.all(entries.map((entry) => entry.run()));
}
