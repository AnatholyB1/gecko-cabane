/**
 * Tiny form helpers with no heavy dependency, safe to import from Client Components (PERF-04).
 * validation.ts re-exports them: it pulls libphonenumber, which the public pages load on demand only.
 */

import type { CountryCode } from 'libphonenumber-js/min'

/** Default phone country for a UI locale (fr -> FR, en -> GB, fallback TH). */
export function phoneCountryForLocale(locale: string): CountryCode {
  if (locale === 'fr') return 'FR'
  if (locale === 'en') return 'GB'
  if (locale === 'de') return 'DE'
  if (locale === 'sv') return 'SE'
  return 'TH'
}

/** Simple email format check (max 254 chars). */
export function isEmailValid(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}
