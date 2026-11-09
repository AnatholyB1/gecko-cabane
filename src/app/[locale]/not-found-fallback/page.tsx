import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import NotFound from '../not-found'

// Target of the middleware rewrite for any unknown path under a valid locale (src/middleware.ts), which
// also sets the 404 status. Rendering here keeps the 404 inside the [locale] layout: translated text,
// <html lang>, site fonts. Per-request on purpose (a prerendered shell would be cached as is).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function NotFoundFallback({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale)
  return <NotFound />
}
