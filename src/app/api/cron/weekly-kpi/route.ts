import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { addDays } from '@/utils/review-invitations'
import { previousWeek, parseWeekParam, weekEndOf, shouldSendNow } from '@/utils/kpi-week'
import { collectDbKpis } from '@/utils/kpi-collect'
import { collectExternalKpis } from '@/utils/kpi-sources'
import { compareWeeks, detectAlerts } from '@/utils/kpi-alerts'
import { buildNarrativeInput, fallbackNarrative, generateNarrative } from '@/utils/kpi-narrative'
import { getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL } from '@/utils/resend'
import { resolveReportMode, reportRecipients } from '@/utils/kpi-mode'
import { weeklyReportEmail } from '@/utils/kpi-report-email'
import type { ApiResponse, KpiAlert, KpiNarrative, KpiReportMode, KpiSourcesStatus, WeeklyKpiRow } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ADMIN_KPI_URL = 'https://geckocabanerestaurant.com/admin/kpi'

// Internal budget (maxDuration = 60 s): below 15 s left before 50 s, skip the AI call.
const BUDGET_MS = 50_000
const MIN_AI_MS = 15_000

function externalEnv() {
  const e = process.env
  return {
    GSC_SERVICE_ACCOUNT_JSON: e.GSC_SERVICE_ACCOUNT_JSON,
    GSC_SITE_URL: e.GSC_SITE_URL,
    BRIGHTDATA_API_KEY: e.BRIGHTDATA_API_KEY,
    BRIGHTDATA_ZONE: e.BRIGHTDATA_ZONE,
    TRIPADVISOR_URL: e.TRIPADVISOR_URL,
  }
}

// Comparison with S-1, threshold alerts and reading. Claude is called only when a key and a model
// are configured, never in dry runs, and never when the time budget is nearly spent; any failure
// yields the rich deterministic fallback (built from the real comparison and alerts).
async function buildReading(
  row: WeeklyKpiRow,
  previous: WeeklyKpiRow | null,
  opts: { dryRun: boolean; startedAt: number }
): Promise<{ alerts: KpiAlert[]; narrative: KpiNarrative }> {
  const comparison = compareWeeks(row, previous)
  const alerts = detectAlerts(row, previous)
  const remaining = BUDGET_MS - (Date.now() - opts.startedAt)
  if (remaining < MIN_AI_MS) return { alerts, narrative: fallbackNarrative(comparison, alerts) }
  const generated = await generateNarrative(buildNarrativeInput(row, comparison, alerts), {
    apiKey: opts.dryRun ? undefined : process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
    timeoutMs: Math.min(20_000, remaining - 5_000),
  })
  return {
    alerts,
    narrative: generated.source === 'ai' ? generated : fallbackNarrative(comparison, alerts),
  }
}

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
  alerts?: KpiAlert[]
  narrative?: KpiNarrative
}

// Weekly job (Monday 00:00 UTC = 07:00 Krabi; a second entry at 01:00 UTC is a safety net).
// Collects the database-side KPIs of the week that just ended and upserts them by week_start.
export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<KpiCronResult>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
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
    const { data: existingData } = await admin
      .from('gecko_weekly_kpis')
      .select('*')
      .eq('week_start', week.start)
      .maybeSingle()
    const existingRow = (existingData as WeeklyKpiRow | null) ?? null
    const alreadyCollected = sendEligible && !!existingRow?.collected_at

    let collected = false
    let collectedStatus: KpiSourcesStatus = {}
    if (!alreadyCollected) {
      const previousRow = (prev as WeeklyKpiRow | null) ?? null
      // Database and external sources in parallel. Bright Data is paid: never called in a dry run.
      const [dbRes, extRes] = await Promise.allSettled([
        collectDbKpis(admin, week, previousRow),
        collectExternalKpis(week, existingRow, externalEnv(), { skipPaid: dryRun }),
      ])
      if (dbRes.status === 'rejected') throw dbRes.reason
      if (extRes.status === 'rejected') Sentry.captureException(extRes.reason)
      const ext =
        extRes.status === 'fulfilled'
          ? extRes.value
          : { values: {} as Partial<WeeklyKpiRow>, status: { search_console: 'unavailable', tripadvisor: 'unavailable' } as KpiSourcesStatus }
      const values: Partial<WeeklyKpiRow> = { ...dbRes.value.values, ...ext.values }
      const status: KpiSourcesStatus = { ...dbRes.value.status, ...ext.status }

      if (dryRun) {
        const reading = await buildReading(
          { ...(existingRow ?? {}), ...values, week_start: week.start, week_end: week.end, sources_status: status } as WeeklyKpiRow,
          previousRow,
          { dryRun: true, startedAt }
        )
        return NextResponse.json<ApiResponse<KpiCronResult>>({
          data: {
            week_start: week.start,
            week_end: week.end,
            collected: false,
            sources_status: status,
            dryRun: true,
            values,
            alerts: reading.alerts,
            narrative: reading.narrative,
          },
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
      const loaded = fullRow as WeeklyKpiRow
      result.sources_status = loaded.sources_status ?? {}
      result.mode = mode

      // Already sent (no release): skip BEFORE drafting, so no AI call on a second pass or a manual
      // ?send=1, and the stored reading is not overwritten.
      if (loaded.report_sent_at != null) {
        result.skipped = true
        return NextResponse.json<ApiResponse<KpiCronResult>>({ data: result })
      }

      // Re-read row (manual entry included): comparison with S-1, alerts and reading, stored before the claim.
      const reading = await buildReading(loaded, (prev as WeeklyKpiRow | null) ?? null, { dryRun: false, startedAt })
      const row: WeeklyKpiRow = { ...loaded, alerts: reading.alerts, narrative: reading.narrative }
      const { error: readingError } = await admin
        .from('gecko_weekly_kpis')
        .update({ alerts: reading.alerts, narrative: reading.narrative, updated_at: now.toISOString() })
        .eq('week_start', week.start)
      if (readingError) Sentry.captureException(readingError) // non-fatal: sent from memory

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
