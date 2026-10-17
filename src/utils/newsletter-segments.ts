/**
 * Newsletter segmentation rules (D-06, D-14, D-16). Pure module.
 *
 * Country: phone country first; the stored geo country only for web sources
 * (devices at the restaurant geolocate to TH, which would mislabel tourists).
 * Resident: checkbox or a +66 phone. Tourist is the default.
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { addDays, krabiToday, REVIEW_ELIGIBLE_STATUSES } from './review-invitations'
import { GEO_ALLOWED_SOURCES, NEWSLETTER_LOCALES } from './newsletter-schema'
import { groupByEmail, resolveEmailState, type LedgerRow } from './newsletter-ledger'

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

// ---------------------------------------------------------------------------
// Daily Brevo sync selectors (D-05, D-07, D-15, D-03). Pure.
// ---------------------------------------------------------------------------

export interface SyncReservation {
  customer_email: string | null
  reservation_date: string
  customer_phone: string | null
  status: string
}

export interface SyncUpdate {
  row: LedgerRow
  profile: SubscriberProfile
}

/**
 * Subscribers whose visit date, country or resident flag differs from what was
 * last pushed. Only honored reservations (confirmed/completed, date <= today).
 */
export function selectSyncUpdates(
  actives: Map<string, LedgerRow>,
  reservations: SyncReservation[],
  today: string
): SyncUpdate[] {
  const latestByEmail = new Map<string, SyncReservation>()
  for (const r of reservations) {
    if (!r.customer_email) continue
    if (!(REVIEW_ELIGIBLE_STATUSES as readonly string[]).includes(r.status)) continue
    if (r.reservation_date > today) continue
    const key = r.customer_email.trim().toLowerCase()
    const prev = latestByEmail.get(key)
    if (!prev || r.reservation_date >= prev.reservation_date) latestByEmail.set(key, r)
  }

  const updates: SyncUpdate[] = []
  for (const [email, row] of actives) {
    const reservation = latestByEmail.get(email.toLowerCase())
    const profile = buildSubscriberProfile(row, {
      phone: reservation?.customer_phone ?? null,
      lastVisit: reservation?.reservation_date ?? null,
    })
    const changed =
      profile.lastVisit !== row.last_visit_synced ||
      profile.country !== row.country ||
      profile.resident !== row.is_resident
    if (changed) updates.push({ row, profile })
  }
  return updates
}

/**
 * Fallback list triggers: J+2 after the visit (after the J+1 review email) and
 * J+3 for tourists still in town (D-07).
 */
export function selectSequenceListAdds(
  profiles: { email: string; lastVisit: string | null; resident: boolean }[],
  today: string
): { afterVisit: string[]; duringStay: string[] } {
  const j2 = addDays(today, -2)
  const j3 = addDays(today, -3)
  return {
    afterVisit: profiles.filter((p) => p.lastVisit === j2).map((p) => p.email),
    duringStay: profiles.filter((p) => p.lastVisit === j3 && !p.resident).map((p) => p.email),
  }
}

/**
 * D-03: emails that ticked the reservation-form box, were never sent a
 * confirmation mail (on any row) and are still pending. Oldest first.
 */
export function selectLegacyConfirmations(allRows: LedgerRow[], limit: number): LedgerRow[] {
  const picked: LedgerRow[] = []
  for (const rows of groupByEmail(allRows).values()) {
    if (rows.some((r) => r.confirmation_sent_at !== null)) continue
    if (resolveEmailState(rows).status !== 'pending') continue
    const forms = rows.filter((r) => r.source === 'reservation_form' && r.consent)
    if (forms.length === 0) continue
    const latestForm = forms.reduce((best, r) => {
      const d = Date.parse(r.consented_at) - Date.parse(best.consented_at)
      return d > 0 || (d === 0 && r.id > best.id) ? r : best
    })
    picked.push(latestForm)
  }
  picked.sort((a, b) => Date.parse(a.consented_at) - Date.parse(b.consented_at) || a.id - b.id)
  return picked.slice(0, Math.max(0, limit))
}
