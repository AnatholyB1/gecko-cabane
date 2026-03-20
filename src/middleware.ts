import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Sentry tunnel and dev tools entirely — no auth, no i18n
  if (pathname.startsWith('/monitoring') || pathname.startsWith('/sentry-example-page')) {
    return NextResponse.next()
  }

  // Collect cookies Supabase wants to write during session refresh.
  // We apply them to whichever response we ultimately return so the browser
  // always receives up-to-date session tokens.
  const pendingCookies: {
    name: string
    value: string
    options: Record<string, unknown>
  }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mutate the request so downstream Server Components see the new tokens.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Collect with full options (httpOnly, secure, sameSite, path, …) so
          // we can stamp them verbatim onto any response type we return.
          pendingCookies.push(...(cookiesToSet as typeof pendingCookies))
        },
      },
    }
  )

  // IMPORTANT: No logic between createServerClient and getUser().
  // getUser() validates the JWT with Supabase and triggers a token refresh
  // (via setAll above) when the access token has expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Stamp all pending session cookies onto the given response and return it.
  function withCookies(response: NextResponse): NextResponse {
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(
        name,
        value,
        options as Parameters<typeof response.cookies.set>[2]
      )
    )
    return response
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthPage =
    pathname === '/admin/login' || pathname === '/admin/signup'

  // Unauthenticated user hitting a protected admin page → redirect to login
  if (isAdminRoute && !isAuthPage && !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return withCookies(NextResponse.redirect(loginUrl))
  }

  // Authenticated user hitting login/signup → bounce to dashboard
  if (isAuthPage && user) {
    return withCookies(NextResponse.redirect(new URL('/admin', request.url)))
  }

  // ── Pass-through for admin / API / auth-callback ──────────────────────────
  if (isAdminRoute || pathname.startsWith('/api') || pathname.startsWith('/auth')) {
    return withCookies(NextResponse.next({ request }))
  }

  // ── Public pages: next-intl locale routing ────────────────────────────────
  // Let next-intl build its response (redirect / rewrite for locale prefix),
  // then stamp any refreshed session cookies onto it.
  return withCookies(intlMiddleware(request))
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - _next/static  (static chunks)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - monitoring    (Sentry tunnel – must bypass middleware)
     * - sentry-example-page
     * - image assets  (svg, png, jpg, …)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|monitoring|sentry-example-page|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
