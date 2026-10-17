import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import type { LedgerRow } from '@/utils/newsletter-ledger'
import { resolveEmailState } from '@/utils/newsletter-ledger'
import { parseLinkParams, verifyNewsletterLink } from '@/utils/newsletter-links'
import { buildWithdrawalRow } from '@/utils/newsletter-withdrawal'
import { blacklistBrevoContact } from '@/utils/brevo'

export const dynamic = 'force-dynamic'

type UnsubscribeData = { status: 'unsubscribed' | 'already' }

// POST only: the GET page never withdraws, so link scanners cannot unsubscribe anyone.
// Accepts the page button (JSON) and the RFC 8058 one-click POST (form body, r/s in the query).
export async function POST(request: NextRequest) {
  const fail = (error: string, code: string, status: number) =>
    NextResponse.json<ApiResponse<never>>({ error, code }, { status })
  const invalid = () => fail('Lien invalide', 'invalid', 400)
  const str = (v: unknown) => (typeof v === 'string' ? v : null)

  let r = request.nextUrl.searchParams.get('r')
  let s = request.nextUrl.searchParams.get('s')
  if (!r || !s) {
    const contentType = request.headers.get('content-type') ?? ''
    try {
      if (contentType.includes('application/json')) {
        const body = (await request.json()) as Record<string, unknown> | null
        r = r ?? str(body?.r)
        s = s ?? str(body?.s)
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const form = new URLSearchParams(await request.text())
        r = r ?? form.get('r')
        s = s ?? form.get('s')
      }
    } catch {
      return invalid()
    }
  }

  try {
    const params = parseLinkParams({ r, s })
    if (!params) return invalid()

    const secret = process.env.NEWSLETTER_SIGNING_SECRET
    if (!secret) {
      Sentry.captureMessage('NEWSLETTER_SIGNING_SECRET is not set: newsletter unsubscribe disabled', 'error')
      return fail('Service indisponible', 'unavailable', 503)
    }

    const nowSec = Math.floor(Date.now() / 1000)
    if (!verifyNewsletterLink(secret, 'unsubscribe', params.rowId, undefined, params.sig, nowSec)) {
      return invalid()
    }

    // Service role: the consent ledger has no public write policy (anon DML revoked in 011)
    // and gecko_newsletter_count is executable by service_role only.
    const admin = createAdminClient()

    const { data: found, error: findError } = await admin
      .from('gecko_marketing_consents')
      .select('*')
      .eq('id', params.rowId)
      .maybeSingle()
    if (findError) {
      Sentry.captureException(findError)
      return fail('Erreur serveur', 'server_error', 500)
    }
    if (!found) return invalid()
    const row = found as LedgerRow

    const { data: siblings, error: siblingsError } = await admin
      .from('gecko_marketing_consents')
      .select('*')
      .ilike('email', row.email.replace(/[\\%_]/g, '\\$&')) // escape LIKE wildcards
    if (siblingsError) {
      Sentry.captureException(siblingsError)
      return fail('Erreur serveur', 'server_error', 500)
    }
    const rows = ((siblings ?? []) as LedgerRow[]).filter(
      (x) => x.email.toLowerCase() === row.email.toLowerCase()
    )

    const state = resolveEmailState(rows)
    if (state.status === 'withdrawn' || state.status === 'none') {
      return NextResponse.json<ApiResponse<UnsubscribeData>>({ data: { status: 'already' } })
    }

    const { error: insertError } = await admin.from('gecko_marketing_consents').insert(
      buildWithdrawalRow({
        email: row.email,
        locale: row.locale,
        source: 'unsubscribe_link',
        at: new Date().toISOString(),
      })
    )
    if (insertError) {
      Sentry.captureException(insertError)
      return fail('Erreur serveur', 'server_error', 500)
    }

    const { error: countError } = await admin.rpc('gecko_newsletter_count', {
      p_event: 'unsubscribed',
      p_source: 'unsubscribe_link',
    })
    if (countError) Sentry.captureException(countError)

    // The ledger is the proof; a Brevo failure is only reported.
    const blacklisted = await blacklistBrevoContact(row.email)
    if (!blacklisted.ok && !blacklisted.skipped) {
      Sentry.captureMessage('Brevo blacklist failed after unsubscribe', 'error')
    }

    return NextResponse.json<ApiResponse<UnsubscribeData>>({ data: { status: 'unsubscribed' } })
  } catch (e) {
    Sentry.captureException(e)
    return fail('Erreur serveur', 'server_error', 500)
  }
}
