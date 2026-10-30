import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/auth'
import type { ApiResponse, Reservation, ReservationStatus } from '@/types/database'
import {
  reservationRequestSchema,
  firstErrorCode,
  MARKETING_CONSENT_VERSION,
  type ReservationErrorCode,
} from '@/utils/reservation-schema'
import { sanitizeUtm, isReservationSource } from '@/utils/reservation-source'
import { emailLocaleFor } from '@/utils/review-invitations'
import { checkSlot, type SettingsMap } from '@/utils/reservation-rules'
import { isHoneypotFilled, checkFillTime } from '@/utils/anti-bot'
import { sendReservationOptInConfirmation } from '@/utils/newsletter-reservation-confirm'
import { checkReservationRateLimits, getClientIp } from '@/utils/rate-limit'
import {
  type EmailLocale,
  getResendClient,
  RESEND_FROM_EMAIL,
  RESTAURANT_NOTIFICATION_EMAIL,
  customerPendingEmail,
  restaurantNotificationEmail,
  customerStatusEmail,
} from '@/utils/resend'

// GET: List reservations (admin only — D-14: no public lookup by phone)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let query = supabase
    .from('gecko_reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (date) query = query.eq('reservation_date', date)
  if (status && status !== 'all') query = query.eq('status', status)
  if (startDate) query = query.gte('reservation_date', startDate)
  if (endDate) query = query.lte('reservation_date', endDate)

  const { data, error } = await query

  if (error) {
    Sentry.captureException(error)
    return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<Reservation[]>>({ data: (data ?? []) as Reservation[] })
}

// POST: Create a new reservation (public, no OTP — D-01)
export async function POST(request: NextRequest) {
  const fail = (error: string, code: ReservationErrorCode, status: number) =>
    NextResponse.json<ApiResponse<never>>({ error, code }, { status })

  // (a) body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Requête invalide', 'invalid_body', 400)
  }

  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>

  // Honeypot: fake success, silent to avoid teaching bots (D-09). No DB, email or after().
  if (isHoneypotFilled(input.company_url)) {
    return NextResponse.json<ApiResponse<{ id: number; status: 'pending' }>>(
      { data: { id: 0, status: 'pending' } },
      { status: 201 }
    )
  }

  // Minimum fill time (3 s) / stale or forged timestamp (D-09)
  if (!checkFillTime(input.form_started_at, Date.now())) {
    return fail('Envoi trop rapide, merci de réessayer.', 'too_fast', 400)
  }

  try {
    // (b) schema validation (email required, E.164 phone, party size)
    const parsed = reservationRequestSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Données de réservation invalides', firstErrorCode(parsed.error), 400)
    }
    const r = parsed.data

    // (c) Service role: gecko_reservations has no public RLS policy and
    // gecko_create_reservation is executable by service_role only.
    const admin = createAdminClient()
    const [hoursRes, specialRes, settingsRes] = await Promise.all([
      admin.from('gecko_opening_hours').select('day_of_week, is_open, open_time, close_time'),
      admin
        .from('gecko_special_hours')
        .select('date, is_open, open_time, close_time')
        .eq('date', r.reservation_date),
      admin.from('gecko_restaurant_settings').select('key, value'),
    ])
    if (hoursRes.error || specialRes.error || settingsRes.error) {
      Sentry.captureException(hoursRes.error ?? specialRes.error ?? settingsRes.error)
      return fail('Erreur serveur', 'server_error', 500)
    }
    const settings: SettingsMap = {}
    for (const row of (settingsRes.data ?? []) as { key: string; value: string }[]) {
      settings[row.key] = row.value
    }

    // (d) opening hours / past slots / party size
    const slot = checkSlot({
      date: r.reservation_date,
      time: r.reservation_time,
      partySize: r.party_size,
      regular: (hoursRes.data ?? []) as Parameters<typeof checkSlot>[0]['regular'],
      special: (specialRes.data ?? []) as Parameters<typeof checkSlot>[0]['special'],
      settings,
    })
    if (!slot.ok) {
      if (slot.code === 'slot_unavailable') {
        return fail("Ce créneau n'est pas disponible", 'slot_unavailable', 422)
      }
      return fail(
        slot.code === 'date_past' ? 'Ce créneau est déjà passé' : 'Nombre de personnes invalide',
        slot.code,
        400
      )
    }

    // (d2) rate limits, after validation so invalid input never consumes quota (D-08).
    // A 409 slot_full below has already consumed one unit: accepted, no refund.
    const limits = await checkReservationRateLimits(admin, {
      ip: getClientIp(request.headers),
      email: r.customer_email,
      phone: r.customer_phone,
    })
    if (limits.limited) {
      return NextResponse.json<ApiResponse<never>>(
        {
          error:
            r.locale === 'fr'
              ? 'Trop de demandes depuis votre connexion. Écrivez-nous directement sur WhatsApp : +66 81 958 5945.'
              : 'Too many requests from your connection. Message us directly on WhatsApp: +66 81 958 5945.',
          code: 'rate_limited',
        },
        { status: 429 }
      )
    }

    // (e) atomic capacity check + insert + consent (single transaction)
    const { data: rpcData, error: rpcError } = await admin.rpc('gecko_create_reservation', {
      p_name: r.customer_name,
      p_email: r.customer_email,
      p_phone: r.customer_phone,
      p_date: r.reservation_date,
      p_time: r.reservation_time,
      p_party: r.party_size,
      p_occasion: r.occasion ?? null,
      p_locale: r.locale,
      p_marketing_consent: r.marketing_consent,
      p_consent_version: MARKETING_CONSENT_VERSION,
    })
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (rpcError || !row) {
      Sentry.captureException(rpcError ?? new Error('gecko_create_reservation returned no row'))
      return fail('Erreur lors de la création', 'server_error', 500)
    }
    if (row.is_full) {
      return fail('Ce créneau est complet', 'slot_full', 409)
    }
    const id: number = row.reservation_id

    // Attribution (D-05), best effort. Service role already justified at (c); source is
    // never written here, the column default 'site' applies (D-04).
    const attribution = {
      utm_source: sanitizeUtm(r.utm_source),
      utm_medium: sanitizeUtm(r.utm_medium),
      ref: sanitizeUtm(r.ref),
    }
    if (Object.values(attribution).some((v) => v !== null)) {
      try {
        const { error: utmError } = await admin
          .from('gecko_reservations')
          .update(attribution)
          .eq('id', id)
        if (utmError) Sentry.captureException(utmError)
      } catch (e) {
        Sentry.captureException(e)
      }
    }

    // (f) emails after the response is sent
    const locale: EmailLocale = emailLocaleFor(r.locale)
    const details = {
      customer_name: r.customer_name,
      customer_email: r.customer_email,
      customer_phone: r.customer_phone,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      party_size: r.party_size,
      occasion: r.occasion ?? null,
    }
    after(async () => {
      try {
        // Reservation-form opt-in stays pending until the guest clicks the double opt-in link.
        if (r.marketing_consent) {
          await sendReservationOptInConfirmation(admin, { email: r.customer_email, reservationId: id })
        }
        const resend = getResendClient()
        if (resend) {
          const sends: Promise<unknown>[] = []
          const customer = customerPendingEmail(details, locale)
          sends.push(
            resend.emails.send({
              from: RESEND_FROM_EMAIL,
              to: r.customer_email,
              subject: customer.subject,
              html: customer.html,
            })
          )
          if (RESTAURANT_NOTIFICATION_EMAIL) {
            const staff = restaurantNotificationEmail({ ...details, locale })
            sends.push(
              resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: RESTAURANT_NOTIFICATION_EMAIL,
                subject: staff.subject,
                html: staff.html,
              })
            )
          }
          const results = await Promise.allSettled(sends)
          for (const res of results) {
            if (res.status === 'rejected') Sentry.captureException(res.reason)
          }
        }
      } catch (afterError) {
        Sentry.captureException(afterError)
      }
    })

    // (g) no PII echoed
    return NextResponse.json<ApiResponse<{ id: number; status: 'pending' }>>(
      { data: { id, status: 'pending' } },
      { status: 201 }
    )
  } catch (error) {
    Sentry.captureException(error)
    return fail('Erreur serveur', 'server_error', 500)
  }
}

const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]

// PUT: Update reservation status / admin notes (admin only, whitelisted fields)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { supabase } = auth

  const bad = (error: string) =>
    NextResponse.json<ApiResponse<never>>({ error, code: 'invalid_fields' }, { status: 400 })

  try {
    const body = await request.json()
    const id = body?.id

    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      return bad('ID requis')
    }

    // Whitelist: only status, admin_notes and source can be changed (no mass assignment)
    const updates: Record<string, string | null> = {}

    if (body.status !== undefined) {
      if (!RESERVATION_STATUSES.includes(body.status)) return bad('Statut invalide')
      updates.status = body.status
      const now = new Date().toISOString()
      if (body.status === 'confirmed') updates.confirmed_at = now
      if (body.status === 'cancelled') updates.cancelled_at = now
    }

    if (body.admin_notes !== undefined) {
      if (body.admin_notes !== null && (typeof body.admin_notes !== 'string' || body.admin_notes.length > 2000)) {
        return bad('Notes invalides')
      }
      updates.admin_notes = body.admin_notes
    }

    if (body.source !== undefined) {
      if (!isReservationSource(body.source)) return bad('Source invalide')
      updates.source = body.source
    }

    if (Object.keys(updates).length === 0) return bad('Aucune modification')
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('gecko_reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      if (error) Sentry.captureException(error)
      return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
    }

    // Notify on confirmation / cancellation (best-effort, never fails the update)
    if (updates.status === 'confirmed' || updates.status === 'cancelled') {
      const newStatus = updates.status
      const resend = getResendClient()
      if (resend && data.customer_email) {
        const emailLocale: EmailLocale = emailLocaleFor(data.locale ?? 'fr')
        const { subject, html } = customerStatusEmail(
          {
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            reservation_date: data.reservation_date,
            reservation_time: data.reservation_time,
            party_size: data.party_size,
            occasion: data.occasion,
          },
          newStatus,
          emailLocale
        )
        try {
          await resend.emails.send({ from: RESEND_FROM_EMAIL, to: data.customer_email, subject, html })
        } catch (resendError) {
          Sentry.captureException(resendError)
        }
      }
    }

    return NextResponse.json<ApiResponse<Reservation>>({ data: data as Reservation })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
  }
}

// DELETE: Delete reservation (admin only)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json<ApiResponse<never>>({ error: 'ID requis', code: 'invalid_fields' }, { status: 400 })
  }

  const { error } = await supabase.from('gecko_reservations').delete().eq('id', id)

  if (error) {
    Sentry.captureException(error)
    return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<{ id: number }>>({ data: { id } })
}
