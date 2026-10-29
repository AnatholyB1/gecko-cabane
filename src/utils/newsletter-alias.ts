/**
 * Short URLs /newsletter (bill QR, D-12) and /wifi (table card, D-13).
 * Resolves the page locale from Accept-Language (tourists default to EN, like /review)
 * and 307-redirects to /{locale}/{kind}. The path is built from constants only and a
 * single whitelisted src value per alias is forwarded (T-07-05-01).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { pickAcceptLanguage } from '@/utils/review-links'

export type NewsletterAliasKind = 'newsletter' | 'wifi'

export const NEWSLETTER_ALIAS_SRC: Record<NewsletterAliasKind, string> = {
  newsletter: 'qr',
  wifi: 'wifi',
}

export function buildNewsletterAliasPath(
  kind: NewsletterAliasKind,
  locale: 'fr' | 'en',
  params: { src: string | null }
): string {
  const base = `/${locale}/${kind}`
  return params.src === NEWSLETTER_ALIAS_SRC[kind] ? `${base}?src=${NEWSLETTER_ALIAS_SRC[kind]}` : base
}

export function handleNewsletterAlias(request: NextRequest, kind: NewsletterAliasKind): NextResponse {
  const picked = pickAcceptLanguage(request.headers.get('accept-language'))
  // Newsletter copy exists in fr and en only; de/sv visitors read en until reviewed (D-09).
  const locale = picked === 'fr' ? 'fr' : 'en'
  const src = request.nextUrl.searchParams.get('src')
  // Temporary redirect only: the target varies per request.
  const response = NextResponse.redirect(
    new URL(buildNewsletterAliasPath(kind, locale, { src }), request.url),
    307
  )
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
