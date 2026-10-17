import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import {
  subscribeRequestSchema,
  firstNewsletterErrorCode,
  sanitizeGeoCountry,
  GEO_ALLOWED_SOURCES,
  NEWSLETTER_CONSENT_VERSION,
} from '@/utils/newsletter-schema'
import {
  resolveEmailState,
  decideSubscribeAction,
  type LedgerRow,
} from '@/utils/newsletter-ledger'
import {
  buildConfirmUrl,
  buildUnsubscribeUrl,
  buildOneClickUnsubscribeUrl,
} from '@/utils/newsletter-links'
import { isHoneypotFilled, checkFillTime } from '@/utils/anti-bot'
import { checkNewsletterRateLimits, getClientIp } from '@/utils/rate-limit'
import { getResendClient, RESEND_FROM_EMAIL, newsletterConfirmEmail } from '@/utils/resend'

export const dynamic = 'force-dynamic'

// POST: start the double opt-in. Pending consent row + signed confirmation email (D-01, D-02).
// Nothing is pushed to the mailing provider before the visitor confirms.
export async function POST(request: NextRequest) {
  // Same body for new, pending, active and bot submissions: no enumeration (T-07-01-03).
  const ok = () => NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true } })
  const fail = (error: string, code: string, status: number) =>
    NextResponse.json<ApiResponse<never>>({ error, code }, { status })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Requête invalide', 'invalid', 400)
  }
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>

  // Anti-bot: silent uniform success, no write, no email.
  if (isHoneypotFilled(input.website)) return ok()
  if (!checkFillTime(input.started_at, Date.now())) return ok()

  try {
    const parsed = subscribeRequestSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Données invalides', firstNewsletterErrorCode(parsed.error), 400)
    }
    const { email, locale, source, resident } = parsed.data

    const secret = process.env.NEWSLETTER_SIGNING_SECRET
    if (!secret) {
      Sentry.captureMessage('NEWSLETTER_SIGNING_SECRET is not set: newsletter subscribe disabled', 'error')
      return fail('Service indisponible', 'unavailable', 503)
    }

    // Service role: the consent ledger has no public write policy (anon DML revoked in 011)
    // and gecko_newsletter_count is executable by service_role only.
    const admin = createAdminClient()

    const ip = getClientIp(request.headers)
    const limits = await checkNewsletterRateLimits(admin, { ip, email })
    if (limits.limited) return fail('Trop de demandes', 'rate_limited', 429)

    const { data: existing, error: selectError } = await admin
      .from('gecko_marketing_consents')
      .select('*')
      .ilike('email', email.replace(/[\\%_]/g, '\\$&')) // escape LIKE wildcards: '_' is common in emails
    if (selectError) {
      Sentry.captureException(selectError)
      return fail('Erreur serveur', 'server_error', 500)
    }

    const state = resolveEmailState((existing ?? []) as LedgerRow[])
    const action = decideSubscribeAction(state, Date.now())
    if (action !== 'create') return ok()

    // D-14: country from the Vercel geo header for web sources only. The IP is never stored.
    const country = GEO_ALLOWED_SOURCES.includes(source)
      ? sanitizeGeoCountry(request.headers.get('x-vercel-ip-country'))
      : null

    const { data: inserted, error: insertError } = await admin
      .from('gecko_marketing_consents')
      .insert({
        email,
        consent: true,
        locale,
        source,
        consent_text_version: NEWSLETTER_CONSENT_VERSION,
        country,
        is_resident: resident,
      })
      .select('id')
      .single()
    if (insertError || !inserted) {
      Sentry.captureException(insertError ?? new Error('newsletter consent insert returned no row'))
      return fail('Erreur serveur', 'server_error', 500)
    }
    const rowId = (inserted as { id: number }).id

    // Claim the send: only one request marks the row as mailed.
    const { data: claimed, error: claimError } = await admin
      .from('gecko_marketing_consents')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', rowId)
      .is('confirmation_sent_at', null)
      .select('id')
    if (claimError) {
      Sentry.captureException(claimError)
      return fail('Erreur serveur', 'server_error', 500)
    }
    if (!claimed || claimed.length === 0) return ok()

    const resetClaim = async () => {
      const { error } = await admin
        .from('gecko_marketing_consents')
        .update({ confirmation_sent_at: null })
        .eq('id', rowId)
      if (error) Sentry.captureException(error)
    }

    const nowSec = Math.floor(Date.now() / 1000)
    const urls = {
      confirm: buildConfirmUrl(secret, locale, rowId, nowSec),
      unsubscribe: buildUnsubscribeUrl(secret, locale, rowId),
    }
    const oneClick = buildOneClickUnsubscribeUrl(secret, rowId)
    const mail = newsletterConfirmEmail(locale === 'fr' ? 'fr' : 'en', urls)

    const resend = getResendClient()
    if (!resend) {
      Sentry.captureMessage('RESEND_API_KEY is not set: newsletter confirmation not sent', 'error')
      await resetClaim()
      return fail('Erreur serveur', 'server_error', 500)
    }
    try {
      const { error: sendError } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: {
          'List-Unsubscribe': `<${oneClick}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      if (sendError) throw new Error(sendError.message)
    } catch (e) {
      Sentry.captureException(e)
      await resetClaim()
      return fail('Erreur serveur', 'server_error', 500)
    }

    const { error: countError } = await admin.rpc('gecko_newsletter_count', {
      p_event: 'subscribed',
      p_source: source,
    })
    if (countError) Sentry.captureException(countError)

    return ok()
  } catch (e) {
    Sentry.captureException(e)
    return fail('Erreur serveur', 'server_error', 500)
  }
}
