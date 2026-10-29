/**
 * HMAC-signed newsletter links (D-02, D-04). Pure module: node:crypto only.
 *
 * Signed payload: `${purpose}:${rowId}:${exp ?? ''}`. Confirm links expire
 * after 30 days; unsubscribe links never expire (a recipient must always be
 * able to withdraw).
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { SITE_URL } from './seo'

export type LinkPurpose = 'confirm' | 'unsubscribe'

export const CONFIRM_TTL_SECONDS = 30 * 86400

export function signNewsletterLink(
  secret: string,
  purpose: LinkPurpose,
  rowId: number,
  exp?: number
): string {
  return createHmac('sha256', secret)
    .update(`${purpose}:${rowId}:${exp ?? ''}`)
    .digest('base64url')
}

export function verifyNewsletterLink(
  secret: string,
  purpose: LinkPurpose,
  rowId: number,
  exp: number | undefined,
  sig: string,
  nowSec: number
): boolean {
  if (exp !== undefined && nowSec > exp) return false
  const expected = signNewsletterLink(secret, purpose, rowId, exp)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const DIGITS = /^[0-9]+$/

function positiveSafeInt(v: string): number | null {
  if (!DIGITS.test(v)) return null
  const n = Number(v)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export function parseLinkParams(p: {
  r?: string | null
  e?: string | null
  s?: string | null
}): { rowId: number; exp: number | undefined; sig: string } | null {
  if (!p.r || !p.s) return null
  const rowId = positiveSafeInt(p.r)
  if (rowId === null) return null
  if (!/^[A-Za-z0-9_-]{43}$/.test(p.s)) return null
  let exp: number | undefined
  if (p.e !== undefined && p.e !== null && p.e !== '') {
    const e = positiveSafeInt(p.e)
    if (e === null) return null
    exp = e
  }
  return { rowId, exp, sig: p.s }
}

/** Page locale for links and emails: fr stays fr, everything else falls back to en (D-02). */
export function toPageLocale(locale: string): 'fr' | 'en' {
  return locale === 'fr' ? 'fr' : 'en'
}

export function buildConfirmUrl(
  secret: string,
  locale: string,
  rowId: number,
  nowSec: number
): string {
  const exp = nowSec + CONFIRM_TTL_SECONDS
  const sig = signNewsletterLink(secret, 'confirm', rowId, exp)
  return `${SITE_URL}/${toPageLocale(locale)}/newsletter/confirm?r=${rowId}&e=${exp}&s=${sig}`
}

export function buildUnsubscribeUrl(secret: string, locale: string, rowId: number): string {
  const sig = signNewsletterLink(secret, 'unsubscribe', rowId)
  return `${SITE_URL}/${toPageLocale(locale)}/newsletter/unsubscribe?r=${rowId}&s=${sig}`
}

export function buildOneClickUnsubscribeUrl(secret: string, rowId: number): string {
  const sig = signNewsletterLink(secret, 'unsubscribe', rowId)
  return `${SITE_URL}/api/newsletter/unsubscribe?r=${rowId}&s=${sig}`
}

export function guideUrl(locale: string): string {
  return `${SITE_URL}/guide-gourmand-krabi-town-${toPageLocale(locale)}.pdf`
}

export function recipeUrl(locale: string): string {
  return `${SITE_URL}/recette-curry-crabe-${toPageLocale(locale)}.pdf`
}
