import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { addDays } from '@/utils/review-invitations'
import { previousWeek, parseWeekParam, weekEndOf } from '@/utils/kpi-week'
import { collectDbKpis } from '@/utils/kpi-collect'
import type { ApiResponse, KpiSourcesStatus, WeeklyKpiRow } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type KpiCronResult = {
  week_start: string
  week_end: string
  collected: boolean
  sources_status: KpiSourcesStatus
  dryRun?: boolean
  values?: Partial<WeeklyKpiRow>
}

// Weekly job (Monday 00:00 UTC = 07:00 Krabi; a second entry at 01:00 UTC is a safety net).
// Collects the database-side KPIs of the week that just ended and upserts them by week_start.
export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const dryRun = params.get('dry') === '1'

  let weekStart: string
  if (params.has('week')) {
    const parsed = parseWeekParam(params.get('week'))
    if (!parsed) {
      return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Semaine invalide' }, { status: 400 })
    }
    weekStart = parsed
  } else {
    weekStart = previousWeek(new Date()).start
  }
  const week = { start: weekStart, end: weekEndOf(weekStart) }

  try {
    // Service role justified: reservations and the consent ledger hold PII with no anon/cron
    // RLS policy, and gecko_weekly_kpis is written by the collector only. This server-only
    // route is gated by CRON_SECRET and handles aggregates (no name/email/phone leaves it).
    const admin = createAdminClient()

    const { data: prev, error: prevError } = await admin
      .from('gecko_weekly_kpis')
      .select('*')
      .eq('week_start', addDays(week.start, -7))
      .maybeSingle()
    if (prevError) Sentry.captureException(prevError) // non-fatal: deltas become unknown (null)

    const { values, status } = await collectDbKpis(admin, week, (prev as WeeklyKpiRow | null) ?? null)

    if (dryRun) {
      return NextResponse.json<ApiResponse<KpiCronResult>>({
        data: { week_start: week.start, week_end: week.end, collected: false, sources_status: status, dryRun: true, values },
      })
    }

    // Only collector columns: manual-entry columns are never touched (upsert by week_start).
    const nowIso = new Date().toISOString()
    const { error } = await admin.from('gecko_weekly_kpis').upsert(
      {
        ...values,
        week_start: week.start,
        week_end: week.end,
        sources_status: status,
        collected_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'week_start' }
    )
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<KpiCronResult>>({
      data: { week_start: week.start, week_end: week.end, collected: true, sources_status: status },
    })
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
