import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

function buildLogoutResponse(
  request: Request,
  pendingCookies: { name: string; value: string; options: Record<string, unknown> }[]
) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url))
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}

export async function POST(request: Request) {
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get('cookie')
            ?.split(';')
            .map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name: name.trim(), value: rest.join('=') }
            }) ?? []
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...(cookiesToSet as typeof pendingCookies))
        },
      },
    }
  )
  await supabase.auth.signOut()
  return buildLogoutResponse(request, pendingCookies)
}

export async function GET(request: Request) {
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get('cookie')
            ?.split(';')
            .map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name: name.trim(), value: rest.join('=') }
            }) ?? []
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...(cookiesToSet as typeof pendingCookies))
        },
      },
    }
  )
  await supabase.auth.signOut()
  return buildLogoutResponse(request, pendingCookies)
}
