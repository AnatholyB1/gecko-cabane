/**
 * Pure routing decision of src/middleware.ts (D-01, phase 18).
 *
 * Public pages (/fr /en /de /sv ...) never touch Supabase: a getUser() round trip on every page view
 * costs latency and marks the response as personalised, which keeps the HTML out of the CDN cache.
 * The Supabase session is only refreshed for /admin, /api and /auth.
 */

import { PAGES } from './seo'

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

// Unknown path under a valid locale (/en/nope): translated 404 inside the locale layout.
// Next renders every SSR 404 through app/not-found.tsx (no root layout here), which cannot know the
// locale without turning dynamic with a nested <html>. So the middleware rewrites unknown locale paths
// to [locale]/not-found-fallback with status 404; that page renders the translated 404 in the layout.
// tests/not-found-routing.test.ts keeps EXTRA_LOCALE_PATHS in sync with src/app/[locale].

const LOCALE_PATH = /^\/(fr|en|de|sv)(\/.*)?$/

/** Paths (after the locale) served by src/app/[locale]/**, besides the PAGES registry. */
export const EXTRA_LOCALE_PATHS = [
  '/wifi',
  '/review',
  '/newsletter',
  '/newsletter/confirm',
  '/newsletter/unsubscribe',
  '/opengraph-image',
] as const

const KNOWN_LOCALE_PATHS: ReadonlySet<string> = new Set([
  '',
  ...EXTRA_LOCALE_PATHS,
  ...PAGES.flatMap((p) => [p.key, ...Object.values(p.slugs)]),
])

/** Locale of a locale-prefixed pathname that matches no page, or null (known page, or no valid locale prefix). */
export function unknownLocalePathLocale(pathname: string): string | null {
  const m = LOCALE_PATH.exec(pathname)
  if (!m) return null
  const rest = (m[2] ?? '').replace(/\/+$/, '')
  return KNOWN_LOCALE_PATHS.has(rest) ? null : m[1]
}
