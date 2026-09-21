import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are inlined at build time — this file
// must be recompiled (not served from Turbopack's persistent build cache)
// whenever those values change on Vercel.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Service-role client that bypasses RLS.
 * Use ONLY in server-side API routes for sensitive operations (e.g. OTP verification).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Checks gecko_admins membership for the currently authenticated user.
 * This Supabase project is shared with the portfolio app — being logged in
 * only proves the user has SOME account in the shared auth pool, not that
 * they're a gecko-cabane admin. gecko_admins is the actual access boundary
 * (also enforced independently by RLS via gecko_is_admin() on every table).
 */
export async function isGeckoAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const { data, error } = await supabase.rpc('gecko_is_admin')
  if (error) return false
  return data === true
}
