import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import type { LedgerRow } from '@/utils/newsletter-ledger'
import { canConfirmRow } from '@/utils/newsletter-ledger'
import {
  parseLinkParams,
  verifyNewsletterLink,
  buildUnsubscribeUrl,
  buildOneClickUnsubscribeUrl,
  guideUrl,
  recipeUrl,
} from '@/utils/newsletter-links'
import { buildSubscriberProfile } from '@/utils/newsletter-segments'
import { upsertBrevoContact } from '@/utils/brevo'
import { getResendClient, RESEND_FROM_EMAIL, newsletterWelcomeEmail } from '@/utils/resend'

export const dynamic = 'force-dynamic'

type ConfirmData = { status: 'confirmed' | 'already'; recipe: boolean; locale: string }

// POST: confirm the double opt-in. Only reachable from the button on the confirm page,
// so mail-scanner prefetches (GET) never confirm anything (D-02).
export async function POST(request: NextRequest) {
  const fail = (error: string, code: string, status: number) =>
    NextResponse.json<ApiResponse<never>>({ error, code }, { status })
  const invalid = () => fail('Lien invalide', 'invalid', 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalid()
  }
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : null)

  try {
    const params = parseLinkParams({ r: str(input.r), e: str(input.e), s: str(input.s) })
    if (!params) return invalid()

    const secret = process.env.NEWSLETTER_SIGNING_SECRET
    if (!secret) {
      Sentry.captureMessage('NEWSLETTER_SIGNING_SECRET is not set: newsletter confirm disabled', 'error')
      return fail('Service indisponible', 'unavailable', 503)
    }

    const nowSec = Math.floor(Date.now() / 1000)
    if (!verifyNewsletterLink(secret, 'confirm', params.rowId, params.exp, params.sig, nowSec)) {
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
      (r) => r.email.toLowerCase() === row.email.toLowerCase()
    )
    if (!row.consent || !canConfirmRow(rows, row.id)) return invalid()

    const recipe = row.source === 'bill_qr'
    const respond = (status: ConfirmData['status']) =>
      NextResponse.json<ApiResponse<ConfirmData>>({ data: { status, recipe, locale: row.locale } })

    if (row.confirmed_at) return respond('already')

    // Conditional update: exactly one request wins the confirmation.
    const { data: updated, error: updateError } = await admin
      .from('gecko_marketing_consents')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('confirmed_at', null)
      .select('*')
    if (updateError) {
      Sentry.captureException(updateError)
      return fail('Erreur serveur', 'server_error', 500)
    }
    if (!updated || updated.length === 0) return respond('already')
    const confirmedRow = updated[0] as LedgerRow

    const { error: countError } = await admin.rpc('gecko_newsletter_count', {
      p_event: 'confirmed',
      p_source: row.source,
    })
    if (countError) Sentry.captureException(countError)

    // D-14: reservation sign-ups carry the guest phone, used for country and resident.
    let phone: string | null = null
    if (row.source === 'reservation_form' && row.reservation_id) {
      const { data: reservation, error: reservationError } = await admin
        .from('gecko_reservations')
        .select('customer_phone')
        .eq('id', row.reservation_id)
        .maybeSingle()
      if (reservationError) Sentry.captureException(reservationError)
      phone = (reservation as { customer_phone: string | null } | null)?.customer_phone ?? null
    }

    // Brevo strictly after confirmed_at is set. A failure leaves brevo_synced_at null for the cron retry.
    const profile = buildSubscriberProfile(confirmedRow, { phone })
    const synced = await upsertBrevoContact(profile)
    if (synced.ok) {
      const { error: syncError } = await admin
        .from('gecko_marketing_consents')
        .update({
          brevo_synced_at: new Date().toISOString(),
          country: profile.country,
          is_resident: profile.resident,
          last_visit_synced: profile.lastVisit,
        })
        .eq('id', row.id)
      if (syncError) Sentry.captureException(syncError)
    }

    // Welcome email with the guide. A send failure never undoes the confirmation.
    try {
      const resend = getResendClient()
      if (!resend) {
        Sentry.captureMessage('RESEND_API_KEY is not set: newsletter welcome not sent', 'error')
      } else {
        const mail = newsletterWelcomeEmail(row.locale === 'fr' ? 'fr' : 'en', {
          guide: guideUrl(row.locale),
          recipe: recipe ? recipeUrl(row.locale) : null,
          unsubscribe: buildUnsubscribeUrl(secret, row.locale, row.id),
        })
        const oneClick = buildOneClickUnsubscribeUrl(secret, row.id)
        const { error: sendError } = await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: row.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          headers: {
            'List-Unsubscribe': `<${oneClick}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        if (sendError) throw new Error(sendError.message)
      }
    } catch (e) {
      Sentry.captureException(e)
    }

    return respond('confirmed')
  } catch (e) {
    Sentry.captureException(e)
    return fail('Erreur serveur', 'server_error', 500)
  }
}
