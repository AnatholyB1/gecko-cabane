import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Protected routes that require authentication
  const protectedPaths = ['/admin']
  const authPaths = ['/admin/login', '/admin/signup']
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname === path || 
    (request.nextUrl.pathname.startsWith(path + '/') && !authPaths.includes(request.nextUrl.pathname))
  )
  const isAuthPath = authPaths.includes(request.nextUrl.pathname)

  // If trying to access protected route without auth, redirect to login
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
