/**
 * One FIFO promise chain per cart-line key so Remove / Undo / qty never
 * overlap on the same Nest row handle.
 */
export function createLineMutationQueue() {
  const tails = new Map<string, Promise<unknown>>();

  function enqueue<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const next = previous.then(
      () => work(),
      () => work(),
    );
    tails.set(key, next);
    void next.finally(() => {
      if (tails.get(key) === next) {
        tails.delete(key);
      }
    });
    return next;
  }

  return { enqueue };
}

export type LineMutationQueue = ReturnType<typeof createLineMutationQueue>;
