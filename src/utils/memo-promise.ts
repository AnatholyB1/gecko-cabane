/**
 * Memoizes an async loader (e.g. a dynamic import) but forgets a REJECTED result, so a transient failure
 * (network hiccup on a lazy chunk) can be retried instead of staying cached until a page reload.
 */
export function memoizeUntilRejected<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null
  return () => {
    if (!cached) {
      const p = load()
      cached = p
      p.catch(() => {
        if (cached === p) cached = null
      })
    }
    return cached
  }
}
