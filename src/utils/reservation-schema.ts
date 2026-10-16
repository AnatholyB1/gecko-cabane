/**
 * Reservation request schema (zod) — server validation authority.
 *
 * Produces a normalized body (E.164 phone, lowercased email) and maps zod
 * issues to the stable error codes consumed by the API and the booking form.
 */

import { z } from 'zod'
import { parsePhone, phoneCountryForLocale } from './validation'
import { MAX_PARTY_SIZE } from './reservation-rules'

/** Set server-side only; never read from the client. */
export const MARKETING_CONSENT_VERSION = 'reservation-form-2026-10-16'

export type ReservationErrorCode =
  | 'invalid_body'
  | 'invalid_fields'
  | 'invalid_email'
  | 'invalid_phone'
  | 'invalid_party_size'
  | 'date_past'
  | 'slot_unavailable'
  | 'slot_full'
  | 'rate_limited'
  | 'too_fast'
  | 'server_error'

export const reservationRequestSchema = z
  .object({
    customer_name: z.string().trim().min(2).max(100),
    customer_email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    customer_phone: z.string().trim().min(5).max(30),
    phone_country: z.string().length(2).toUpperCase().optional(),
    reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reservation_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    party_size: z.number().int().min(1).max(MAX_PARTY_SIZE),
    occasion: z.string().trim().max(100).nullish(),
    locale: z.enum(['fr', 'en']).default('fr'),
    marketing_consent: z.boolean().default(false),
    company_url: z.string().max(200).optional(), // honeypot, checked in 01-08
    form_started_at: z.number().int().optional(), // timing check, in 01-08
  })
  .transform((data, ctx) => {
    const country = (data.phone_country ?? phoneCountryForLocale(data.locale)) as Parameters<typeof parsePhone>[1]
    const phone = parsePhone(data.customer_phone, country)
    if (!phone) {
      ctx.addIssue({ code: 'custom', path: ['customer_phone'], message: 'invalid_phone' })
      return z.NEVER
    }
    return { ...data, customer_phone: phone }
  })

export type ReservationRequest = z.output<typeof reservationRequestSchema>

/** Map the first zod issue to a stable error code. */
export function firstErrorCode(error: z.ZodError): ReservationErrorCode {
  const field = error.issues[0]?.path[0]
  if (field === 'customer_email') return 'invalid_email'
  if (field === 'customer_phone') return 'invalid_phone'
  if (field === 'party_size') return 'invalid_party_size'
  return 'invalid_fields'
}
