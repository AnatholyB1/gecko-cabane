import * as Sentry from '@sentry/nextjs'
import type { createAdminClient } from '@/utils/supabase/server'
import { resolveEmailState, decideSubscribeAction, type LedgerRow } from '@/utils/newsletter-ledger'
import { buildConfirmUrl, buildUnsubscribeUrl, buildOneClickUnsubscribeUrl } from '@/utils/newsletter-links'
import { newsletterConfirmEmail } from '@/utils/newsletter-emails'
import { sendIdempotencyKey } from '@/utils/newsletter-send'
import { getResendClient, RESEND_FROM_EMAIL } from '@/utils/resend'

type Admin = ReturnType<typeof createAdminClient>

export type ReservationOptInResult =
  | 'sent'
  | 'skipped'
  | 'no_secret'
  | 'no_resend'
  | 'no_row'
  | 'failed'

/**
 * Reservation-form opt-ins are stored pending (consent = true, confirmed_at = null).
 * This sends them the SAME double opt-in confirmation mail as the public form, once, right
 * after the reservation: no marketing mail is ever sent before the guest clicks confirm.
 * Fail closed: any email that has ever withdrawn, is already active, was mailed in the last
 * 24 h or hit the pending cap gets nothing. Never throws.
 */
export async function sendReservationOptInConfirmation(
  admin: Admin,
  input: { email: string; reservationId: number }
): Promise<ReservationOptInResult> {
  try {
    const secret = process.env.NEWSLETTER_SIGNING_SECRET
    if (!secret) return 'no_secret'
    const resend = getResendClient()
    if (!resend) return 'no_resend'

    const email = input.email.trim().toLowerCase()
    const { data, error } = await admin
      .from('gecko_marketing_consents')
      .select('*')
      .ilike('email', email.replace(/[\\%_]/g, '\\$&'))
    if (error) {
      Sentry.captureException(error)
      return 'failed'
    }
    const rows = (data ?? []) as LedgerRow[]
    const mine = rows.find((r) => r.reservation_id === input.reservationId && r.consent)
    if (!mine) return 'no_row'

    // The new row itself is unsent, so judge the address on the OTHER rows.
    const others = rows.filter((r) => r.id !== mine.id)
    const state = resolveEmailState(others)
    if (decideSubscribeAction(state, Date.now()) !== 'create') return 'skipped'

    const { data: claimed, error: claimError } = await admin
      .from('gecko_marketing_consents')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', mine.id)
      .is('confirmation_sent_at', null)
      .select('id')
    if (claimError) {
      Sentry.captureException(claimError)
      return 'failed'
    }
    if (!claimed || claimed.length === 0) return 'skipped'

    const locale = mine.locale === 'fr' ? 'fr' : 'en'
    const mail = newsletterConfirmEmail(locale, {
      confirm: buildConfirmUrl(secret, mine.locale, mine.id, Math.floor(Date.now() / 1000)),
      unsubscribe: buildUnsubscribeUrl(secret, mine.locale, mine.id),
    })
    try {
      const { error: sendError } = await resend.emails.send(
        {
          from: RESEND_FROM_EMAIL,
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          headers: {
            'List-Unsubscribe': `<${buildOneClickUnsubscribeUrl(secret, mine.id)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        },
        { idempotencyKey: sendIdempotencyKey(email, 'reservation_optin', String(mine.id)) }
      )
      if (sendError) {
        const { error: resetError } = await admin
          .from('gecko_marketing_consents')
          .update({ confirmation_sent_at: null })
          .eq('id', mine.id)
        if (resetError) Sentry.captureException(resetError)
        Sentry.captureMessage(`Reservation opt-in confirmation failed: ${sendError.name}`, 'warning')
        return 'failed'
      }
    } catch (e) {
      // Ambiguous: the mail may have left. Keep the claim (no duplicate), report it.
      Sentry.captureException(e)
      return 'failed'
    }
    return 'sent'
  } catch (e) {
    Sentry.captureException(e)
    return 'failed'
  }
}
