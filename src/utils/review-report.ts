/**
 * Review report helpers (REV-06, D-09): monthly aggregation of the 05-05 counters
 * and month-over-month evolution of the manually entered Google/TripAdvisor totals.
 *
 * Pure module. Months are 'YYYY-MM' (DB month = 'YYYY-MM-01'), computed on the
 * Asia/Bangkok calendar like the counting RPC.
 */

import { REVIEW_STAT_SOURCES } from '@/utils/review-links'
import type { ReviewHitKind, ReviewStatSource } from '@/utils/review-links'

export const REVIEW_SOURCE_LABELS: Record<ReviewStatSource, string> = {
  email: 'Email',
  qr: 'QR code',
  wa: 'WhatsApp',
  site: 'Site',
  unknown: 'Inconnue',
}

export type ClickRow = { month: string; source: ReviewStatSource; kind: ReviewHitKind; hits: number }
export type TotalRow = {
  month: string
  platform: 'google' | 'tripadvisor'
  total_reviews: number
}

type Counts = { visit: number; google: number; tripadvisor: number }

export function buildMonthTable(rows: ClickRow[], month: string) {
  const prefix = `${month}-`
  const bySource = new Map<ReviewStatSource, Counts>(
    REVIEW_STAT_SOURCES.map((s) => [s, { visit: 0, google: 0, tripadvisor: 0 }])
  )
  const total: Counts = { visit: 0, google: 0, tripadvisor: 0 }
  let isEmpty = true
  for (const r of rows) {
    if (!r.month.startsWith(prefix)) continue
    const c = bySource.get(r.source)
    if (!c) continue
    c[r.kind] += r.hits
    total[r.kind] += r.hits
    isEmpty = false
  }
  return {
    rows: REVIEW_STAT_SOURCES.map((source) => ({
      source,
      label: REVIEW_SOURCE_LABELS[source],
      ...bySource.get(source)!,
    })),
    total,
    isEmpty,
  }
}

export function lastMonths(n: number, now: Date = new Date()): string[] {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')!.value)
  const month = Number(parts.find((p) => p.type === 'month')!.value)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const idx = year * 12 + (month - 1) - i
    const y = Math.floor(idx / 12)
    const m = (idx % 12) + 1
    out.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  return out
}

function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const idx = y * 12 + (m - 1) - 1
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`
}

export type TotalsEvolutionRow = {
  month: string
  google: number | null
  tripadvisor: number | null
  googleDelta: number | null
  tripadvisorDelta: number | null
}

export function totalsEvolution(rows: TotalRow[]): TotalsEvolutionRow[] {
  const byMonth = new Map<string, { google: number | null; tripadvisor: number | null }>()
  for (const r of rows) {
    const key = r.month.slice(0, 7)
    const entry = byMonth.get(key) ?? { google: null, tripadvisor: null }
    entry[r.platform] = r.total_reviews
    byMonth.set(key, entry)
  }
  const delta = (cur: number | null, prev: number | null | undefined) =>
    cur !== null && prev !== null && prev !== undefined ? cur - prev : null
  return [...byMonth.keys()]
    .sort()
    .reverse()
    .map((month) => {
      const cur = byMonth.get(month)!
      const prev = byMonth.get(previousMonth(month))
      return {
        month,
        google: cur.google,
        tripadvisor: cur.tripadvisor,
        googleDelta: delta(cur.google, prev?.google),
        tripadvisorDelta: delta(cur.tripadvisor, prev?.tripadvisor),
      }
    })
}

export function parseMonthParam(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : null
}

export function isValidTotal(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100000
}
