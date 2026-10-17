import type { NextRequest } from 'next/server'
import { handleReviewAlias } from '@/utils/review-alias'

export const dynamic = 'force-dynamic'

// DE hint resolves to the EN page until German is published (D-10).
export async function GET(request: NextRequest) {
  return handleReviewAlias(request, 'de')
}
