/**
 * Newsletter segmentation rules (D-06, D-14, D-16). Pure module.
 *
 * Country: phone country first; the stored geo country only for web sources
 * (devices at the restaurant geolocate to TH, which would mislabel tourists).
 * Resident: checkbox or a +66 phone. Tourist is the default.
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { krabiToday } from './review-invitations'
import { GEO_ALLOWED_SOURCES, NEWSLETTER_LOCALES } from './newsletter-schema'
import type { LedgerRow } from './newsletter-ledger'

export function phoneCountry(phone: string | null | undefined): string | null {
  if (!phone) return null
  try {
    return parsePhoneNumberFromString(phone)?.country ?? null
  } catch {
    return null
  }
}

export function isThaiPhone(phone: string | null | undefined): boolean {
  if (!phone) return false
  try {
    return parsePhoneNumberFromString(phone)?.countryCallingCode === '66'
  } catch {
    return false
  }
}

export function resolveCountry(input: {
  phoneCountry: string | null
  geoCountry: string | null
  source: string
}): string | null {
  if (input.phoneCountry) return input.phoneCountry
  if (GEO_ALLOWED_SOURCES.includes(input.source) && input.geoCountry) return input.geoCountry
  return null
}

export function resolveResident(input: { checkbox: boolean; phone?: string | null }): boolean {
  return input.checkbox || isThaiPhone(input.phone)
}

/** Krabi calendar date (YYYY-MM-DD) of an ISO timestamp. */
export function krabiDateOf(iso: string): string {
  return krabiToday(new Date(iso))
}

/** D-06: bill QR and WiFi sign-ups start their J+2/J+3 clock at confirmation. */
export function initialLastVisit(row: {
  source: string
  confirmed_at: string | null
}): string | null {
  if ((row.source === 'bill_qr' || row.source === 'wifi') && row.confirmed_at) {
    return krabiDateOf(row.confirmed_at)
  }
  return null
}

export interface SubscriberProfile {
  email: string
  language: string
  country: string | null
  resident: boolean
  source: string
  consentAt: string
  lastVisit: string | null
}

export function buildSubscriberProfile(
  row: LedgerRow,
  opts: { phone?: string | null; lastVisit?: string | null }
): SubscriberProfile {
  const language = (NEWSLETTER_LOCALES as readonly string[]).includes(row.locale) ? row.locale : 'en'
  const initial = initialLastVisit(row)
  const lastVisit = [opts.lastVisit ?? null, initial].reduce<string | null>(
    (best, d) => (d && (best === null || d > best) ? d : best),
    null
  )
  return {
    email: row.email,
    language,
    country: resolveCountry({
      phoneCountry: phoneCountry(opts.phone),
      geoCountry: row.country,
      source: row.source,
    }),
    resident: resolveResident({ checkbox: row.is_resident, phone: opts.phone }),
    source: row.source,
    consentAt: row.consented_at,
    lastVisit,
  }
}
