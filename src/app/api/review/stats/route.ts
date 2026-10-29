import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { isValidTotal, lastMonths, parseMonthParam } from '@/utils/review-report'
import type { ClickRow, TotalRow } from '@/utils/review-report'
import type { ApiResponse } from '@/types/database'

/**
 * Admin-only review stats (REV-06, D-09).
 * GET: monthly counters + manual totals. PUT: upsert manual Google/TripAdvisor totals.
 * Cookie client under RLS (gecko_is_admin); no service role, no external review API.
 */
const PLATFORMS = ['google', 'tripadvisor'] as const

const serverError = () =>
  NextResponse.json({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const raw = Number(new URL(request.url).searchParams.get('months') ?? 12) || 12
    const months = Math.min(24, Math.max(1, Math.trunc(raw)))
    const from = `${lastMonths(months).at(-1)}-01`

    const [clicks, totals] = await Promise.all([
      auth.supabase.from('gecko_review_clicks').select('month, source, kind, hits').gte('month', from),
      auth.supabase
        .from('gecko_review_monthly_totals')
        .select('month, platform, total_reviews')
        .gte('month', from)
        .order('month', { ascending: false }),
    ])

    if (clicks.error || totals.error) {
      Sentry.captureException(clicks.error ?? totals.error)
      return serverError()
    }

    return NextResponse.json<ApiResponse<{ clicks: ClickRow[]; totals: TotalRow[] }>>({
      data: {
        clicks: (clicks.data ?? []) as ClickRow[],
        totals: (totals.data ?? []) as TotalRow[],
      },
    })
  } catch (e) {
    Sentry.captureException(e)
    return serverError()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    let body: Record<string, unknown>
    try {
      const parsed = await request.json()
      if (!parsed || typeof parsed !== 'object') throw new Error('not an object')
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Requête invalide', code: 'invalid_body' }, { status: 400 })
    }

    const month = parseMonthParam(body.month)
    if (!month) {
      return NextResponse.json({ error: 'Mois invalide', code: 'invalid_fields' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const rows: Array<{ month: string; platform: string; total_reviews: number; updated_at: string }> = []
    for (const platform of PLATFORMS) {
      const value = body[platform]
      if (value === undefined || value === null) continue
      if (!isValidTotal(value)) {
        return NextResponse.json(
          { error: 'Valeur invalide : entrez un nombre entier.', code: 'invalid_fields' },
          { status: 400 }
        )
      }
      rows.push({ month: `${month}-01`, platform, total_reviews: value, updated_at: now })
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Aucune valeur', code: 'invalid_fields' }, { status: 400 })
    }

    const { error } = await auth.supabase
      .from('gecko_review_monthly_totals')
      .upsert(rows, { onConflict: 'month,platform' })
    if (error) {
      Sentry.captureException(error)
      return serverError()
    }

    return NextResponse.json<ApiResponse<typeof rows>>({ data: rows })
  } catch (e) {
    Sentry.captureException(e)
    return serverError()
  }
}
