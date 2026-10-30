import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { weekEndOf } from '@/utils/kpi-week'
import { manualKpiSchema, shouldAlertLowRating, lowRatingAlertEmail } from '@/utils/kpi-manual'
import { getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL } from '@/utils/resend'
import { SITE_URL } from '@/utils/seo'
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

/**
 * PUT /api/kpi: saisie manuelle hebdomadaire des avis Google (KPI-07, D-03).
 * Grants 018: pas d'UPDATE sur week_start => select puis update OU insert, jamais upsert.
 * Note minimale <= seuil, nouvelle ou modifiée => email d'alerte immédiat (D-08).
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Requête invalide', code: 'invalid_body' }, { status: 400 })
    }

    const parsed = manualKpiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Saisie invalide', code: 'invalid_input' }, { status: 400 })
    }
    const input = parsed.data

    const { data: existing, error: readError } = await auth.supabase
      .from('gecko_weekly_kpis')
      .select('week_start, google_min_rating')
      .eq('week_start', input.week_start)
      .maybeSingle()
    if (readError) {
      Sentry.captureException(readError)
      return serverError()
    }

    const now = new Date().toISOString()
    const manual = {
      google_reviews_total: input.google_reviews_total,
      google_new_reviews: input.google_new_reviews,
      google_min_rating: input.google_min_rating,
      manual_note: input.manual_note,
      manual_updated_at: now,
    }

    const { data: row, error: writeError } = existing
      ? await auth.supabase
          .from('gecko_weekly_kpis')
          .update({ ...manual, updated_at: now })
          .eq('week_start', input.week_start)
          .select('*')
          .single()
      : await auth.supabase
          .from('gecko_weekly_kpis')
          .insert({
            week_start: input.week_start,
            week_end: weekEndOf(input.week_start),
            ...manual,
          })
          .select('*')
          .single()
    if (writeError || !row) {
      Sentry.captureException(writeError ?? new Error('kpi manual write returned no row'))
      return serverError()
    }

    const alerted = shouldAlertLowRating(
      (existing as { google_min_rating: number | null } | null)?.google_min_rating,
      input.google_min_rating
    )

    if (alerted && input.google_min_rating !== null) {
      const rating = input.google_min_rating
      const weekStart = input.week_start
      const note = input.manual_note
      after(async () => {
        try {
          const resend = getResendClient()
          if (!resend || !RESTAURANT_NOTIFICATION_EMAIL) {
            Sentry.captureMessage('kpi low rating alert not configured', 'error')
            return
          }
          const mail = lowRatingAlertEmail({
            weekStart,
            rating,
            note,
            adminUrl: `${SITE_URL}/admin/kpi`,
          })
          await resend.emails.send(
            {
              from: RESEND_FROM_EMAIL,
              to: RESTAURANT_NOTIFICATION_EMAIL,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            },
            { idempotencyKey: `kpi-lowrating-${weekStart}-${rating}` }
          )
        } catch (e) {
          // Never put the free-text note in Sentry events.
          Sentry.captureException(e)
        }
      })
    }

    return NextResponse.json<ApiResponse<{ row: WeeklyKpiRow; alerted: boolean }>>({
      data: { row: row as WeeklyKpiRow, alerted },
    })
  } catch (e) {
    Sentry.captureException(e)
    return serverError()
  }
}
