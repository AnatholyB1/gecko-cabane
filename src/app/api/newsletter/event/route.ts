import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = ['popup_shown', 'popup_dismissed'] as const

// POST: anonymous pop-up counters (D-11). No IP, cookie or identifier is read or stored.
// The source is fixed server-side so the client cannot pollute other sources.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<never>>({ error: 'Requête invalide', code: 'invalid' }, { status: 400 })
  }
  const event = body && typeof body === 'object' ? (body as Record<string, unknown>).event : undefined
  if (typeof event !== 'string' || !(ALLOWED_EVENTS as readonly string[]).includes(event)) {
    return NextResponse.json<ApiResponse<never>>({ error: 'Événement invalide', code: 'invalid' }, { status: 400 })
  }

  try {
    // Service role: the counter table has RLS and no grants; the RPC is executable by service_role only.
    const admin = createAdminClient()
    const { error } = await admin.rpc('gecko_newsletter_count', { p_event: event, p_source: 'popup' })
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
  }
}
