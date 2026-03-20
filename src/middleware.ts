import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

const handleI18nRouting = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Capture the cookies Supabase wants to persist (with full options)
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mutate request cookies so downstream server code sees them,
          // and collect them to apply to the final response.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          pendingCookies.push(...(cookiesToSet as typeof pendingCookies))
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // Doing so can cause sporadic auth failures.
  await supabase.auth.getUser()

  // Build the appropriate response
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/auth')

  let response: NextResponse
  if (isAdminRoute || isApiRoute || isAuthRoute) {
    response = NextResponse.next({ request })
  } else {
    // Let next-intl handle locale prefixing / redirects for public pages
    response = handleI18nRouting(request)
  }

  // Stamp the refreshed session cookies onto whichever response we return
  pendingCookies.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico   (favicon)
     *  - public assets (svg, png, jpg, …)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
