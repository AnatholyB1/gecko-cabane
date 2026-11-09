/**
 * Pure routing decision of src/middleware.ts (D-01, phase 18).
 *
 * Public pages (/fr /en /de /sv ...) never touch Supabase: a getUser() round trip on every page view
 * costs latency and marks the response as personalised, which keeps the HTML out of the CDN cache.
 * The Supabase session is only refreshed for /admin, /api and /auth.
 */

export type RouteKind =
  | 'monitoring' // Sentry tunnel: untouched
  | 'alias' // /review /avis /bewertung /newsletter /wifi: resolved by the alias route handler, no session
  | 'session' // /admin /api /auth: Supabase session refresh (+ admin guard for /admin)
  | 'public' // everything else: next-intl locale routing only, no Supabase

const ALIASES = new Set(['/review', '/avis', '/bewertung', '/newsletter', '/wifi'])

export function classifyPath(pathname: string): RouteKind {
  if (pathname.startsWith('/monitoring')) return 'monitoring'
  if (ALIASES.has(pathname)) return 'alias'
  if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/auth')) {
    return 'session'
  }
  return 'public'
}
