/**
 * Resend Contacts client (NEWS-01, NEWS-07). Server-only: reads RESEND_API_KEY.
 * Replaces the Brevo client (owner decision 2026-10-29: one provider).
 *
 * The Supabase consent ledger stays the source of truth for consent and segments;
 * the Resend contact is a mirror (segments as custom properties) so the owner can
 * also use the Resend dashboard. Never throws; failures are reported to Sentry
 * without the email and surfaced as { ok: false }.
 */

import * as Sentry from '@sentry/nextjs'
import { getResendClient } from './resend'
import type { SubscriberProfile } from './newsletter-segments'

export interface ContactResult {
  ok: boolean
  skipped?: boolean
}

const SKIPPED: ContactResult = { ok: false, skipped: true }

/** Custom property keys to create once in Resend (scripts/setup-resend-newsletter.mjs). */
export const CONTACT_PROPERTY_KEYS = [
  'language',
  'country',
  'resident',
  'source',
  'consent_at',
  'last_visit',
] as const

export function buildContactProperties(p: SubscriberProfile): Record<string, string> {
  return {
    language: p.language,
    country: p.country ?? '',
    resident: p.resident ? 'yes' : 'no',
    source: p.source,
    consent_at: p.consentAt.slice(0, 10),
    last_visit: p.lastVisit ?? '',
  }
}

function segmentIds(): { id: string }[] {
  const id = process.env.RESEND_SEGMENT_ID
  return id ? [{ id }] : []
}

function contactEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Case-insensitive removal of the address from a provider message (no PII in Sentry). */
function redactEmail(text: string, email: string): string {
  return text.toLowerCase().split(email).join('[email]')
}

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve()
}

/**
 * Create the contact; when creation is refused, look it up and update its properties only
 * if it exists. A missing contact means the create error is the real cause: it is reported
 * as such (Sentry GECKO-CABANE-R) and update is never attempted. `unsubscribed: false` is
 * sent only with `freshOptIn` (confirm route, explicit double opt-in): a cron retry never
 * re-subscribes someone who unsubscribed inside Resend (PDPA/GDPR).
 */
export async function upsertResendContact(
  profile: SubscriberProfile,
  options: { freshOptIn?: boolean; pauseMs?: number } = {}
): Promise<ContactResult> {
  const resend = getResendClient()
  if (!resend) return SKIPPED
  const properties = buildContactProperties(profile)
  const email = contactEmail(profile.email)
  const pauseMs = options.pauseMs ?? 600
  try {
    const created = await resend.contacts.create({
      email,
      unsubscribed: false,
      properties,
      segments: segmentIds(),
    })
    if (!created.error) return { ok: true }

    await sleep(pauseMs)
    const found = await resend.contacts.get({ email })
    if (found.error) {
      if (found.error.name === 'not_found') {
        const detail = redactEmail(created.error.message, email)
        Sentry.captureMessage(`Resend contact create failed: ${created.error.name}`, {
          level: 'warning',
          extra: { statusCode: created.error.statusCode, detail },
        })
      } else {
        Sentry.captureMessage(`Resend contact lookup failed: ${found.error.name}`, 'warning')
      }
      return { ok: false }
    }

    const alreadyUnsubscribed = found.data?.unsubscribed === true
    if (alreadyUnsubscribed && options.freshOptIn !== true) {
      Sentry.captureMessage('Resend contact unsubscribed but ledger active: left unsubscribed', 'info')
    }
    await sleep(pauseMs)
    const updated = await resend.contacts.update({
      email,
      properties,
      ...(options.freshOptIn === true ? { unsubscribed: false } : {}),
    })
    if (!updated.error) return { ok: true }
    Sentry.captureMessage(`Resend contact update failed: ${updated.error.name}`, 'warning')
    return { ok: false }
  } catch {
    Sentry.captureMessage('Resend contact upsert failed (network or timeout)', 'warning')
    return { ok: false }
  }
}

/** Segment properties only; never touches the unsubscribed flag. */
export async function updateResendContactProperties(
  profile: SubscriberProfile
): Promise<ContactResult> {
  const resend = getResendClient()
  if (!resend) return SKIPPED
  try {
    const { error } = await resend.contacts.update({
      email: contactEmail(profile.email),
      properties: buildContactProperties(profile),
    })
    if (error) {
      Sentry.captureMessage(`Resend contact update failed: ${error.name}`, 'warning')
      return { ok: false }
    }
    return { ok: true }
  } catch {
    Sentry.captureMessage('Resend contact update failed (network or timeout)', 'warning')
    return { ok: false }
  }
}

/** Mirror a withdrawal into Resend. The ledger is the proof; a failure is only reported. */
export async function unsubscribeResendContact(email: string): Promise<ContactResult> {
  const resend = getResendClient()
  if (!resend) return SKIPPED
  try {
    const { error } = await resend.contacts.update({ email: contactEmail(email), unsubscribed: true })
    if (error) {
      Sentry.captureMessage(`Resend contact unsubscribe failed: ${error.name}`, 'warning')
      return { ok: false }
    }
    return { ok: true }
  } catch {
    Sentry.captureMessage('Resend contact unsubscribe failed (network or timeout)', 'warning')
    return { ok: false }
  }
}
