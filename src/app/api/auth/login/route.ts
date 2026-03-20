import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  // Collect the session cookies set by Supabase so we can apply them
  // directly onto the redirect response. Using createClient() (cookies() from
  // next/headers) + NextResponse.redirect() is unreliable in some production
  // environments because the cookie mutations are not automatically merged into
  // a manually created NextResponse.
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

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  const destination = redirectTo || '/admin'
  const response = NextResponse.redirect(new URL(destination, request.url))

  // Stamp the session cookies onto the redirect so the browser receives them.
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )

  return response
}
