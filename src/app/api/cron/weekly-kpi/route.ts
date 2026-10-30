import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { addDays } from '@/utils/review-invitations'
import { previousWeek, parseWeekParam, weekEndOf, shouldSendNow } from '@/utils/kpi-week'
import { collectDbKpis } from '@/utils/kpi-collect'
import { getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL } from '@/utils/resend'
import { resolveReportMode, reportRecipients } from '@/utils/kpi-mode'
import { weeklyReportEmail } from '@/utils/kpi-report-email'
import type { ApiResponse, KpiReportMode, KpiSourcesStatus, WeeklyKpiRow } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ADMIN_KPI_URL = 'https://geckocabanerestaurant.com/admin/kpi'

type KpiCronResult = {
  week_start: string
  week_end: string
  collected: boolean
  sent?: boolean
  skipped?: boolean
  failed?: boolean
  mode?: KpiReportMode
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

    const now = new Date()
    const sendEligible = !dryRun && (params.get('send') === '1' || shouldSendNow(now))

    const { data: prev, error: prevError } = await admin
      .from('gecko_weekly_kpis')
      .select('*')
      .eq('week_start', addDays(week.start, -7))
      .maybeSingle()
    if (prevError) Sentry.captureException(prevError) // non-fatal: deltas become unknown (null)

    // Send window: a row already collected is not collected again.
    let alreadyCollected = false
    if (sendEligible) {
      const { data: existing } = await admin
        .from('gecko_weekly_kpis')
        .select('*')
        .eq('week_start', week.start)
        .maybeSingle()
      alreadyCollected = !!(existing as WeeklyKpiRow | null)?.collected_at
    }

    let collected = false
    let collectedStatus: KpiSourcesStatus = {}
    if (!alreadyCollected) {
      const { values, status } = await collectDbKpis(admin, week, (prev as WeeklyKpiRow | null) ?? null)

      if (dryRun) {
        return NextResponse.json<ApiResponse<KpiCronResult>>({
          data: { week_start: week.start, week_end: week.end, collected: false, sources_status: status, dryRun: true, values },
        })
      }

      // Only collector columns: manual-entry columns are never touched (upsert by week_start).
      const nowIso = now.toISOString()
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
      collected = true
      collectedStatus = status
    }

    const result: KpiCronResult = {
      week_start: week.start,
      week_end: week.end,
      collected,
      sources_status: collectedStatus,
      sent: false,
    }

    if (sendEligible) {
      const mode = resolveReportMode(process.env.KPI_REPORT_MODE)
      const to = reportRecipients(mode, RESTAURANT_NOTIFICATION_EMAIL, process.env.KPI_REPORT_RECIPIENTS)
      const resend = getResendClient()
      if (to.length === 0 || !resend) {
        return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Email non configuré' }, { status: 500 })
      }

      const { data: fullRow, error: rowError } = await admin
        .from('gecko_weekly_kpis')
        .select('*')
        .eq('week_start', week.start)
        .maybeSingle()
      if (rowError || !fullRow) {
        if (rowError) Sentry.captureException(rowError)
        return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Erreur serveur' }, { status: 500 })
      }
      const row = fullRow as WeeklyKpiRow
      result.sources_status = row.sources_status ?? {}
      result.mode = mode

      // Claim BEFORE sending: a duplicate cron delivery matches no row.
      const { data: claimed, error: claimError } = await admin
        .from('gecko_weekly_kpis')
        .update({ report_sent_at: now.toISOString(), report_mode: mode })
        .eq('week_start', week.start)
        .is('report_sent_at', null)
        .select('week_start')
      if (claimError || !claimed || claimed.length === 0) {
        if (claimError) Sentry.captureException(claimError)
        result.skipped = true
      } else {
        const { subject, html, text } = weeklyReportEmail({
          row,
          previous: (prev as WeeklyKpiRow | null) ?? null,
          mode,
          adminUrl: ADMIN_KPI_URL,
        })
        let sendFailed = false
        try {
          const res = await resend.emails.send(
            { from: RESEND_FROM_EMAIL, to, subject, html, text },
            { idempotencyKey: `kpi-report-${week.start}-${mode}` }
          )
          sendFailed = !!res.error
        } catch {
          sendFailed = true
        }
        if (sendFailed) {
          // Release the claim so the next run retries.
          await admin
            .from('gecko_weekly_kpis')
            .update({ report_sent_at: null, report_mode: null })
            .eq('week_start', week.start)
          Sentry.captureException(new Error('kpi report send failed'), { extra: { week_start: week.start } })
          result.failed = true
        } else {
          result.sent = true
        }
      }
    }

    return NextResponse.json<ApiResponse<KpiCronResult>>({ data: result })
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
