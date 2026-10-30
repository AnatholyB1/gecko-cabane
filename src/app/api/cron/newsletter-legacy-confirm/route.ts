import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { LedgerRow } from '@/utils/newsletter-ledger'
import { selectLegacyConfirmations } from '@/utils/newsletter-segments'
import {
  buildConfirmUrl,
  buildUnsubscribeUrl,
  buildOneClickUnsubscribeUrl,
} from '@/utils/newsletter-links'
import { getResendClient, RESEND_FROM_EMAIL } from '@/utils/resend'
import { newsletterLegacyConfirmEmail } from '@/utils/newsletter-emails'
import { fetchAllPages } from '@/utils/paginate'
import { sendIdempotencyKey } from '@/utils/newsletter-send'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type LegacyCounts = {
  candidates?: number
  totalEligible?: number
  dryRun?: boolean
  sent?: number
  failed?: number
  remaining?: number
}

const MAX_PER_RUN = 50
const SEND_PAUSE_MS = 600
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// D-03: ONE confirmation mail to each past reservation-form consent that was never asked.
// Manual invocation only (not scheduled in vercel.json), after owner approval. Nobody is
// added to the mailing provider here: only those who click go through the confirm route.
export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<LegacyCounts>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  // Dry-run by default: a real send needs an explicit ?send=1 (and never with ?dry=1).
  const dryRun = params.get('dry') === '1' || params.get('send') !== '1'
  const rawLimit = Number.parseInt(params.get('limit') ?? '', 10)
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : MAX_PER_RUN, MAX_PER_RUN)

  const secret = process.env.NEWSLETTER_SIGNING_SECRET
  if (!secret) {
    Sentry.captureMessage('NEWSLETTER_SIGNING_SECRET is not set: legacy confirmation disabled', 'error')
    return NextResponse.json<ApiResponse<LegacyCounts>>({ error: 'Service indisponible' }, { status: 503 })
  }

  try {
    // Service role justified: the consent ledger has no public policy. This server-only
    // route is gated by CRON_SECRET and returns counts only.
    const admin = createAdminClient()
    let rows: LedgerRow[]
    try {
      rows = await fetchAllPages<LedgerRow>((from, to) =>
        admin
          .from('gecko_marketing_consents')
          .select('*', { count: 'exact' })
          .order('id', { ascending: true })
          .range(from, to)
      )
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json<ApiResponse<LegacyCounts>>({ error: 'Erreur serveur' }, { status: 500 })
    }

    const totalEligible = selectLegacyConfirmations(rows, Number.POSITIVE_INFINITY).length
    const candidates = selectLegacyConfirmations(rows, limit)

    if (dryRun) {
      return NextResponse.json<ApiResponse<LegacyCounts>>({
        data: { candidates: candidates.length, totalEligible, dryRun: true },
      })
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json<ApiResponse<LegacyCounts>>({ error: 'Email non configuré' }, { status: 500 })
    }

    let sent = 0
    let failed = 0

    for (const row of candidates) {
      try {
        // Claim BEFORE sending: a duplicate call matches no row, nobody is mailed twice.
        const { data: claimed, error: claimError } = await admin
          .from('gecko_marketing_consents')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', row.id)
          .is('confirmation_sent_at', null)
          .select('id')
        if (claimError || !claimed || claimed.length === 0) continue

        const locale = row.locale === 'fr' ? 'fr' : 'en'
        const mail = newsletterLegacyConfirmEmail(locale, {
          confirm: buildConfirmUrl(secret, row.locale, row.id, Math.floor(Date.now() / 1000)),
          unsubscribe: buildUnsubscribeUrl(secret, row.locale, row.id),
        })
        const oneClick = buildOneClickUnsubscribeUrl(secret, row.id)

        let sendFailed = false
        try {
          const res = await resend.emails.send(
            {
              from: RESEND_FROM_EMAIL,
              to: row.email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
              headers: {
                'List-Unsubscribe': `<${oneClick}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            },
            { idempotencyKey: sendIdempotencyKey(row.email, 'legacy_confirm', String(row.id)) }
          )
          sendFailed = !!res.error
        } catch {
          sendFailed = true
        }

        if (sendFailed) {
          // Release the claim so a later run can retry this address.
          const { error: resetError } = await admin
            .from('gecko_marketing_consents')
            .update({ confirmation_sent_at: null })
            .eq('id', row.id)
          if (resetError) Sentry.captureException(resetError)
          Sentry.captureException(new Error('legacy confirmation send failed'), {
            extra: { consentId: row.id },
          })
          failed++
        } else {
          sent++
        }
      } catch (err) {
        Sentry.captureException(err, { extra: { consentId: row.id } })
        failed++
      }
      await sleep(SEND_PAUSE_MS)
    }

    return NextResponse.json<ApiResponse<LegacyCounts>>({
      data: { sent, failed, remaining: Math.max(0, totalEligible - sent) },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json<ApiResponse<LegacyCounts>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
