import { NextRequest, NextResponse } from 'next/server'
import { sanitizeReviewSource } from '@/utils/review-links'
import { recordReviewHit } from '@/utils/review-stats'
import { googleReviewUrl, tripAdvisorReviewUrl } from '@/utils/seo'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'

// Fixed destination map: the target is never taken from the request (no open redirect).
const REVIEW_TARGETS = {
  google: googleReviewUrl,
  tripadvisor: tripAdvisorReviewUrl,
} as const

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const t = params.get('t')
  if (t !== 'google' && t !== 'tripadvisor') {
    return NextResponse.json<ApiResponse<never>>({ error: 'Cible invalide' }, { status: 400 })
  }

  const source = sanitizeReviewSource(params.get('src')) ?? 'unknown'
  await recordReviewHit(source, t)

  const res = NextResponse.redirect(REVIEW_TARGETS[t](), 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Robots-Tag', 'noindex')
  return res
}
