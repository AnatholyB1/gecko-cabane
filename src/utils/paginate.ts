/**
 * Range-read helper for PostgREST (Supabase caps one response at max_rows, 1000 by default).
 * Fail closed: the consent ledger decides who may be mailed, so a silently truncated read
 * (a missing withdrawal row) must never be treated as the full ledger. Every page asks for
 * an exact count; if the rows received do not add up to that count the read throws.
 */

export const PAGE_SIZE = 500 // below the default max_rows so a full page is detectable
const MAX_PAGES = 400 // 200 000 rows: beyond this something is wrong, stop

export type PageResult<T> = {
  data: T[] | null
  error: { message: string } | null
  count: number | null
}

export class TruncatedReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TruncatedReadError'
  }
}

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const all: T[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE
    const res = await fetchPage(from, from + PAGE_SIZE - 1)
    if (res.error) throw new Error(res.error.message)
    if (res.count === null || res.count === undefined) {
      throw new TruncatedReadError('paginated read returned no exact count')
    }
    const rows = res.data ?? []
    all.push(...rows)
    if (all.length >= res.count) return all
    if (rows.length === 0) {
      throw new TruncatedReadError(`paginated read stopped at ${all.length} of ${res.count} rows`)
    }
  }
  throw new TruncatedReadError(`paginated read exceeded ${MAX_PAGES} pages`)
}
