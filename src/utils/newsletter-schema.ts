/**
 * Newsletter subscribe request schema (D-01, D-14, D-16). Pure module: zod only.
 */

import { z } from 'zod'

export const NEWSLETTER_SOURCES = ['footer', 'popup', 'bill_qr', 'wifi', 'newsletter_page'] as const

/** Every source value that may appear in the ledger. */
export const LEDGER_SOURCES = [
  ...NEWSLETTER_SOURCES,
  'reservation_form',
  'brevo_webhook',
  'unsubscribe_link',
] as const

export const NEWSLETTER_LOCALES = ['fr', 'en', 'de', 'sv'] as const

export const NEWSLETTER_CONSENT_VERSION = 'newsletter-2026-10-17'

/**
 * Sources for which the Vercel geo header may be stored as country (D-14).
 * Never bill_qr / wifi: devices at the restaurant geolocate to TH.
 */
export const GEO_ALLOWED_SOURCES: readonly string[] = ['footer', 'popup', 'newsletter_page']

export const subscribeRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  locale: z.enum(NEWSLETTER_LOCALES),
  source: z.enum(NEWSLETTER_SOURCES),
  consent: z.literal(true),
  resident: z.boolean().default(false),
  website: z.string().optional(),
  started_at: z.number().optional(),
})

export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>

export type NewsletterErrorCode = 'email' | 'consent' | 'invalid'

export function firstNewsletterErrorCode(error: z.ZodError): NewsletterErrorCode {
  const path = error.issues[0]?.path[0]
  if (path === 'email') return 'email'
  if (path === 'consent') return 'consent'
  return 'invalid'
}

/** ISO 3166-1 alpha-2 (uppercase) or null. */
export function sanitizeGeoCountry(raw: string | null): string | null {
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : null
}
