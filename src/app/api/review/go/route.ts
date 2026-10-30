import { NextRequest, NextResponse, after } from 'next/server'
import { recordReviewHitThrottled } from '@/utils/review-stats'
import { resolveVerifiedSource } from '@/utils/review-tracking'
import { getClientIp } from '@/utils/rate-limit'
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

  const src = params.get('src')
  const rid = params.get('rid')
  const ip = getClientIp(request.headers)
  // REV-06: verification (rid must exist), throttle and write all run after the response;
  // a slow or failing database can never delay or break the redirect.
  after(async () => {
    try {
      await recordReviewHitThrottled(await resolveVerifiedSource(src, rid), t, ip)
    } catch {
      // swallowed: counters are best effort
    }
  })

  const res = NextResponse.redirect(REVIEW_TARGETS[t](), 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Robots-Tag', 'noindex')
  return res
}
