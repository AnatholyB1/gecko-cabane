import type { NextRequest } from 'next/server'
import { handleReviewAlias } from '@/utils/review-alias'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleReviewAlias(request, null)
}
