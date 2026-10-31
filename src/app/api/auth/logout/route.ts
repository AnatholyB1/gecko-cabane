import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Force Turbopack build-cache invalidation when NEXT_PUBLIC_SUPABASE_* env
// vars change on Vercel (see src/utils/supabase/server.ts for details).
function buildLogoutResponse(
  request: Request,
  pendingCookies: { name: string; value: string; options: Record<string, unknown> }[]
) {
  const response = NextResponse.redirect(new URL('/admin/login?m=deconnecte', request.url))
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
  // scope local : le pool Auth est partagé avec une autre application, une déconnexion ici ne
  // doit pas révoquer les sessions du compte ailleurs.
  await supabase.auth.signOut({ scope: 'local' })
  return buildLogoutResponse(request, pendingCookies)
}

/**
 * Sans effet : une déconnexion ne doit pas pouvoir être provoquée par un simple lien ou une image
 * inter-sites. Redirige vers la connexion ; seule la requête POST déconnecte.
 */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
