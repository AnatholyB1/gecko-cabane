import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import {
  reservationRequestSchema,
  firstErrorCode,
  MARKETING_CONSENT_VERSION,
  type ReservationErrorCode,
} from '@/utils/reservation-schema'
import { checkSlot, type SettingsMap } from '@/utils/reservation-rules'
import {
  type EmailLocale,
  getResendClient,
  RESEND_FROM_EMAIL,
  RESTAURANT_NOTIFICATION_EMAIL,
  customerPendingEmail,
  restaurantNotificationEmail,
  customerStatusEmail,
} from '@/utils/resend'

// GET: Fetch reservations (admin only, or by phone for customers)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const phone = searchParams.get('phone')
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // If phone is provided, allow public to check their reservation.
  // gecko_reservations has no public SELECT policy (customer PII), so this
  // uses the service-role client — safe because the phone filter below runs
  // in trusted server code, not as an open query a client could widen.
  if (phone) {
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('gecko_reservations')
      .select('*')
      .eq('customer_phone', phone)
      .order('reservation_date', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  // Admin-only: Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Build query
  let query = supabase
    .from('gecko_reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  // Apply filters
  if (date) {
    query = query.eq('reservation_date', date)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (startDate) {
    query = query.gte('reservation_date', startDate)
  }

  if (endDate) {
    query = query.lte('reservation_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
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

    // (f) webhook + emails after the response is sent
    const locale: EmailLocale = r.locale
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
        const webhookUrl = process.env.RESA_HOOK_URL
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'new_reservation',
                reservation: { id, ...details, locale },
              }),
              signal: AbortSignal.timeout(5000),
            })
          } catch (webhookError) {
            Sentry.captureException(webhookError)
          }
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

// PUT: Update reservation status (admin only)
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Handle status changes with timestamps
    if (updates.status === 'confirmed' && !updates.confirmed_at) {
      updates.confirmed_at = new Date().toISOString()
    }
    if (updates.status === 'cancelled' && !updates.cancelled_at) {
      updates.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('gecko_reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send webhook notification when reservation status changes (confirmed or cancelled)
    if ((updates.status === 'confirmed' || updates.status === 'cancelled') && data) {
      const validationWebhookUrl = process.env.NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL
      if (validationWebhookUrl) {
        try {
          await fetch(validationWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: updates.status === 'confirmed' ? 'reservation_confirmed' : 'reservation_cancelled',
              status: updates.status,
              reservation: {
                id: data.id,
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone,
                reservation_date: data.reservation_date,
                reservation_time: data.reservation_time,
                party_size: data.party_size,
                occasion: data.occasion,
                status: data.status,
                confirmed_at: data.confirmed_at,
                cancelled_at: data.cancelled_at
              }
            })
          })
        } catch (webhookError) {
          console.error('Validation webhook error:', webhookError)
        }
      }

      // Notify the customer by email via Resend (best-effort)
      const resend = getResendClient()
      if (resend && data.customer_email) {
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
          updates.status
        )
        try {
          await resend.emails.send({ from: RESEND_FROM_EMAIL, to: data.customer_email, subject, html })
        } catch (resendError) {
          console.error('Resend status email error:', resendError)
        }
      }
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Delete reservation (admin only)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  }

  const { error } = await supabase
    .from('gecko_reservations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
