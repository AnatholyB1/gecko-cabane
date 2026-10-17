import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import type { LedgerRow } from '@/utils/newsletter-ledger'
import { resolveEmailState } from '@/utils/newsletter-ledger'
import {
  buildWithdrawalRow,
  parseBrevoWebhookEvents,
  tokenMatches,
} from '@/utils/newsletter-withdrawal'

export const dynamic = 'force-dynamic'

// Brevo marketing webhook (unsubscribe / spam). Writes the withdrawal to the ledger only;
// Brevo already holds the contact as unsubscribed, so it is never called back (D-04).
export async function POST(request: NextRequest) {
  const expected = process.env.BREVO_WEBHOOK_TOKEN ?? ''
  const header = request.headers.get('authorization') ?? ''
  const bearer = /^Bearer\s+(.+)$/i.exec(header)?.[1] ?? null
  const given = bearer ?? request.nextUrl.searchParams.get('token')
  if (!expected || !tokenMatches(expected, given)) {
    return NextResponse.json<ApiResponse<never>>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<never>>({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = parseBrevoWebhookEvents(body)
  if (events.length === 0) {
    return NextResponse.json<ApiResponse<{ processed: number }>>({ data: { processed: 0 } })
  }

  try {
    // Service role: the webhook is server-to-server and the ledger has no public write policy.
    const admin = createAdminClient()
    let processed = 0

    for (const event of events) {
      const { data, error } = await admin
        .from('gecko_marketing_consents')
        .select('*')
        .ilike('email', event.email.replace(/[\\%_]/g, '\\$&')) // escape LIKE wildcards
      if (error) throw error
      const rows = ((data ?? []) as LedgerRow[]).filter(
        (r) => r.email.toLowerCase() === event.email
      )
      const state = resolveEmailState(rows)
      if (state.status === 'none' || state.status === 'withdrawn') continue

      const latestRow = rows.reduce((a, b) =>
        Date.parse(b.consented_at) >= Date.parse(a.consented_at) ? b : a
      )
      const { error: insertError } = await admin.from('gecko_marketing_consents').insert(
        buildWithdrawalRow({
          email: event.email,
          locale: latestRow.locale,
          source: 'brevo_webhook',
          at: event.at,
        })
      )
      if (insertError) throw insertError

      const { error: countError } = await admin.rpc('gecko_newsletter_count', {
        p_event: 'unsubscribed',
        p_source: 'brevo_webhook',
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
