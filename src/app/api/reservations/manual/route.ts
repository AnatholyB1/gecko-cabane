import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { validateManualReservation } from '@/utils/manual-reservation'
import type { ApiResponse } from '@/types/database'

/**
 * POST /api/reservations/manual — admin-only entry of a WhatsApp / phone /
 * walk-in reservation (RESA-06, D-06).
 *
 * Admin override by design: no capacity check, no customer email (the guest
 * booked by phone/WhatsApp), no rate limit (admin-only). Insert runs with the
 * cookie client so RLS (gecko_is_admin) applies as defense in depth.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Requête invalide', code: 'invalid_body' }, { status: 400 })
    }

    const parsed = validateManualReservation(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, code: 'invalid_fields' }, { status: 400 })
    }

    const { data, error } = await auth.supabase
      .from('gecko_reservations')
      .insert({
        ...parsed.value,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      Sentry.captureException(error ?? new Error('manual reservation insert returned no data'))
      return NextResponse.json({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({ data: { id: data.id } }, { status: 201 })
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
  }
}
