import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

// Create intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'always' // Always show locale prefix for consistent routing
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip i18n for API routes and admin routes
  const isApiRoute = pathname.startsWith('/api')
  const isAdminRoute = pathname.startsWith('/admin') || pathname.match(/^\/(fr|en)\/admin/)
  const isAuthCallback = pathname.startsWith('/auth')
  
  // For admin and API routes, use only Supabase auth middleware
  if (isApiRoute || isAuthCallback) {
    return handleSupabaseAuth(request)
  }
  
  // For admin routes, handle auth first then locale
  if (isAdminRoute) {
    // Extract locale if present
    const localeMatch = pathname.match(/^\/(fr|en)/)
    const locale = localeMatch ? localeMatch[1] : defaultLocale
    const pathWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'
    
    // Handle Supabase auth for admin
    const authResponse = await handleSupabaseAuth(request, pathWithoutLocale)
    if (authResponse.status !== 200) {
      return authResponse
    }
    
    // Continue without i18n for admin (admin is only in French)
    return authResponse
  }
  
  // For public routes, use i18n middleware
  return intlMiddleware(request)
}

async function handleSupabaseAuth(request: NextRequest, pathOverride?: string) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = pathOverride || request.nextUrl.pathname
  
  // Protected routes that require authentication
  const protectedPaths = ['/admin']
  const authPaths = ['/admin/login', '/admin/signup']
  
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || 
    (pathname.startsWith(path + '/') && !authPaths.includes(pathname))
  )
  const isAuthPath = authPaths.includes(pathname)

  // If trying to access protected route without auth, redirect to login
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access auth pages, redirect to admin
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
