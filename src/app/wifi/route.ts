import type { NextRequest } from 'next/server'
import { handleNewsletterAlias } from '@/utils/newsletter-alias'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleNewsletterAlias(request, 'wifi')
}
