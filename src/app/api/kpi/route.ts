import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import type { ApiResponse, WeeklyKpiRow } from '@/types/database'

/**
 * Admin-only weekly KPI history (KPI-06, D-05).
 * GET /api/kpi?weeks=N (1..52, default 12), newest week first.
 * Cookie client under RLS (gecko_is_admin); no service role.
 */
const DEFAULT_WEEKS = 12
const MAX_WEEKS = 52

const serverError = () =>
  NextResponse.json({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })

function parseWeeks(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_WEEKS
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_WEEKS
  return Math.min(MAX_WEEKS, Math.max(1, Math.trunc(n)))
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const weeks = parseWeeks(new URL(request.url).searchParams.get('weeks'))

    const { data, error } = await auth.supabase
      .from('gecko_weekly_kpis')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(weeks)

    if (error) {
      Sentry.captureException(error)
      return serverError()
    }

    const rows = (data ?? []) as WeeklyKpiRow[]
    const testReportsSent = rows.filter(
      (r) => r.report_mode === 'test' && r.report_sent_at != null
    ).length

    return NextResponse.json<ApiResponse<{ weeks: WeeklyKpiRow[]; testReportsSent: number }>>({
      data: { weeks: rows, testReportsSent },
    })
  } catch (e) {
    Sentry.captureException(e)
    return serverError()
  }
}
