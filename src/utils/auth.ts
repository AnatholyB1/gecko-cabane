/**
 * Shared admin guard for API route handlers.
 *
 * The Supabase project is shared with another app (one auth pool), so being
 * logged in only proves the caller has SOME account. The real access boundary
 * is gecko_admins membership (checked via the gecko_is_admin RPC). RLS on every
 * table enforces the same rule independently (defense in depth).
 *
 * Usage:
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   const { supabase } = auth
 */

import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient, isGeckoAdmin } from '@/utils/supabase/server'

export type RequireAdminResult =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: User }
  | { ok: false; response: NextResponse }

export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // isGeckoAdmin returns false on RPC error -> fail closed
  if (!(await isGeckoAdmin(supabase))) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true, supabase, user }
}
