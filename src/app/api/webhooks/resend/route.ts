import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { getResendClient } from '@/utils/resend'
import type { ApiResponse } from '@/types/database'
import type { LedgerRow } from '@/utils/newsletter-ledger'
import { resolveEmailState } from '@/utils/newsletter-ledger'
import { buildWithdrawalRow, parseResendWebhookEvent } from '@/utils/newsletter-withdrawal'

export const dynamic = 'force-dynamic'

// Resend webhook (Svix-signed): spam complaint, permanent bounce, dashboard unsubscribe.
// Writes the withdrawal to the ledger only; Resend already holds the state (D-04).
export async function POST(request: NextRequest) {
  const unauthorized = () =>
    NextResponse.json<ApiResponse<never>>({ error: 'Unauthorized' }, { status: 401 })

  const secret = process.env.RESEND_WEBHOOK_SECRET
  const resend = getResendClient()
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')
  if (!secret || !resend || !id || !timestamp || !signature) return unauthorized()

  // Raw body: the signature covers the exact bytes, never a re-serialised object.
  const payload = await request.text()
  let event: unknown
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    })
  } catch {
    return unauthorized()
  }

  const events = parseResendWebhookEvent(event)
  if (events.length === 0) {
    return NextResponse.json<ApiResponse<{ processed: number }>>({ data: { processed: 0 } })
  }

  try {
    // Service role: the webhook is server-to-server and the ledger has no public write policy.
    const admin = createAdminClient()
    let processed = 0

    for (const withdrawal of events) {
      const { data, error } = await admin
        .from('gecko_marketing_consents')
        .select('*')
        .ilike('email', withdrawal.email.replace(/[\%_]/g, '\$&')) // escape LIKE wildcards
      if (error) throw error
      const rows = ((data ?? []) as LedgerRow[]).filter(
        (r) => r.email.toLowerCase() === withdrawal.email
      )
      const state = resolveEmailState(rows)
      if (state.status === 'none' || state.status === 'withdrawn') continue

      const latestRow = rows.reduce((a, b) =>
        Date.parse(b.consented_at) >= Date.parse(a.consented_at) ? b : a
      )
      const { error: insertError } = await admin.from('gecko_marketing_consents').insert(
        buildWithdrawalRow({
          email: withdrawal.email,
          locale: latestRow.locale,
          source: 'resend_webhook',
          at: withdrawal.at,
        })
      )
      if (insertError) throw insertError

      const { error: countError } = await admin.rpc('gecko_newsletter_count', {
        p_event: 'unsubscribed',
        p_source: 'resend_webhook',
      })
      if (countError) Sentry.captureException(countError)
      processed++
    }

    return NextResponse.json<ApiResponse<{ processed: number }>>({ data: { processed } })
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
