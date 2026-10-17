/**
 * Shared handler for the /review, /avis and /bewertung short URLs (REV-01, D-10).
 * Resolves the page locale and 307-redirects to /{locale}/review, forwarding only
 * whitelisted query parameters (rid as UUID, src in email|qr|wa).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { buildReviewRedirectPath, resolveReviewLocale } from '@/utils/review-links'

export async function handleReviewAlias(
  request: NextRequest,
  hint: 'fr' | 'de' | null
): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const rid = params.get('rid')
  const src = params.get('src')
  const acceptLanguage = request.headers.get('accept-language')

  // 04-06: ridLocale lookup by review_token
  const locale = resolveReviewLocale({ ridLocale: null, hint, acceptLanguage })

  // Temporary redirect only: the target varies per request and a cached
  // browser redirect would be sticky forever.
  const response = NextResponse.redirect(
    new URL(buildReviewRedirectPath(locale, { rid, src }), request.url),
    307
  )
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
