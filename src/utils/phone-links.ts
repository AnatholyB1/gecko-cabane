/**
 * tel: and WhatsApp links from a stored phone number (Phase 15, RSV-03) — pure.
 * Accepts E.164 and common hand-typed variants; an invalid number yields no link.
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js'

/** Normalise to E.164 ('+66819585945') or null. '00' prefix is treated as '+'. */
export function toE164(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  let s = raw.trim().replace(/[\s().\- ]/g, '')
  if (s === '') return null
  // libphonenumber extracts numbers out of free text: only digits (and one leading +) may remain.
  if (!/^\+?\d+$/.test(s)) return null
  if (s.startsWith('00')) s = '+' + s.slice(2)
  if (!s.startsWith('+')) return null // no default country: never guess one
  const p = parsePhoneNumberFromString(s)
  return p && p.isValid() ? p.number : null
}

/** 'tel:+66819585945' or null. */
export function telLink(raw: string | null | undefined): string | null {
  const e164 = toE164(raw)
  return e164 ? `tel:${e164}` : null
}

/** 'https://wa.me/66819585945' (digits only, no '+') or null. */
export function whatsappLink(raw: string | null | undefined): string | null {
  const e164 = toE164(raw)
  return e164 ? `https://wa.me/${e164.slice(1)}` : null
}

export type PhoneLinks = { tel: string | null; whatsapp: string | null }

export function phoneLinks(raw: string | null | undefined): PhoneLinks {
  return { tel: telLink(raw), whatsapp: whatsappLink(raw) }
}

// ---------------------------------------------------------------------------
// mailto: (audit P15 : `a?bcc=x@y.zz` passe isEmailValid et injecterait un Bcc)
// ---------------------------------------------------------------------------

// Pas de ? & , % ; : < > " ' \ ni espace : ces caractères ouvrent des en-têtes mailto ou des paramètres.
const STRICT_EMAIL = /^[^\s@?&,%;:<>"'\\]+@[^\s@?&,%;:<>"'\\]+\.[^\s@?&,%;:<>"'\\]{2,}$/

/** 'mailto:a%40b.com' après validation stricte, sinon null (le texte reste affiché, sans lien). */
export function mailtoLink(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim()
  return email.length <= 254 && STRICT_EMAIL.test(email) ? `mailto:${encodeURIComponent(email)}` : null
}
