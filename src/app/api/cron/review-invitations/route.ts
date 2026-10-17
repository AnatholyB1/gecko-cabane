import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { getResendClient, RESEND_FROM_EMAIL, reviewInvitationEmail } from '@/utils/resend'
import {
  REVIEW_ELIGIBLE_STATUSES,
  INVITE_WINDOW,
  REMIND_WINDOW,
  addDays,
  krabiToday,
  selectReviewInvitations,
  emailLocaleFor,
  buildEmailReviewUrl,
  type ReviewCandidate,
} from '@/utils/review-invitations'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type CronCounts = {
  today: string
  invited?: number
  reminded?: number
  skipped?: number
  failed?: number
  invite?: number
  remind?: number
  dryRun?: boolean
}

const SEND_PAUSE_MS = 600
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<CronCounts>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry') === '1'

  try {
    // Service role justified: gecko_reservations holds customer PII with no
    // anon/cron RLS policy. This server-only route is gated by CRON_SECRET and
    // returns counts only.
    const admin = createAdminClient()
    const today = krabiToday(new Date())

    const { data, error } = await admin
      .from('gecko_reservations')
      .select(
        'id, status, reservation_date, customer_name, customer_email, locale, review_token, review_email_sent_at, review_reminder_sent_at, review_clicked_at'
      )
      .in('status', [...REVIEW_ELIGIBLE_STATUSES])
      .gte('reservation_date', addDays(today, REMIND_WINDOW.from))
      .lte('reservation_date', addDays(today, INVITE_WINDOW.to))
      .not('customer_email', 'is', null)

    if (error) {
      Sentry.captureException(error)
      return NextResponse.json<ApiResponse<CronCounts>>({ error: 'Erreur serveur' }, { status: 500 })
    }

    const { invite, remind } = selectReviewInvitations((data ?? []) as ReviewCandidate[], today)

    if (dryRun) {
      return NextResponse.json<ApiResponse<CronCounts>>({
        data: { today, invite: invite.length, remind: remind.length, dryRun: true },
      })
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json<ApiResponse<CronCounts>>({ error: 'Email non configuré' }, { status: 500 })
    }

    let invited = 0
    let reminded = 0
    let skipped = 0
    let failed = 0

    const jobs: { r: ReviewCandidate; kind: 'invite' | 'reminder' }[] = [
      ...invite.map((r) => ({ r, kind: 'invite' as const })),
      ...remind.map((r) => ({ r, kind: 'reminder' as const })),
    ]

    for (const { r, kind } of jobs) {
      const column = kind === 'invite' ? 'review_email_sent_at' : 'review_reminder_sent_at'
      try {
        // Claim BEFORE sending: a duplicate cron delivery matches no row.
        let claimQuery = admin
          .from('gecko_reservations')
          .update({ [column]: new Date().toISOString() })
          .eq('id', r.id)
          .in('status', [...REVIEW_ELIGIBLE_STATUSES])
        if (kind === 'invite') {
          claimQuery = claimQuery.is('review_email_sent_at', null)
        } else {
          claimQuery = claimQuery
            .is('review_reminder_sent_at', null)
            .is('review_clicked_at', null)
            .not('review_email_sent_at', 'is', null)
        }
        const { data: claimed, error: claimError } = await claimQuery.select('id')
        if (claimError || !claimed || claimed.length === 0) {
          skipped++
          continue
        }

        const { subject, html, text } = reviewInvitationEmail(
          emailLocaleFor(r.locale),
          buildEmailReviewUrl(r.review_token),
          kind,
          r.customer_name
        )

        let sendFailed = false
        try {
          const res = await resend.emails.send(
            { from: RESEND_FROM_EMAIL, to: r.customer_email as string, subject, html, text },
            { idempotencyKey: `${kind === 'invite' ? 'review-invite-' : 'review-reminder-'}${r.id}` }
          )
          sendFailed = !!res.error
        } catch {
          sendFailed = true
        }

        if (sendFailed) {
          // Release the claim so the bounded catch-up retries on the next run.
          await admin
            .from('gecko_reservations')
            .update(
              kind === 'invite'
                ? { review_email_sent_at: null }
                : { review_reminder_sent_at: null }
            )
            .eq('id', r.id)
          Sentry.captureException(new Error('review email send failed'), {
            extra: { reservationId: r.id, kind },
          })
          failed++
        } else if (kind === 'invite') {
          invited++
        } else {
          reminded++
        }
      } catch (err) {
        Sentry.captureException(err, { extra: { reservationId: r.id, kind } })
        failed++
      }
      await sleep(SEND_PAUSE_MS)
    }

    return NextResponse.json<ApiResponse<CronCounts>>({
      data: { today, invited, reminded, skipped, failed },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json<ApiResponse<CronCounts>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
