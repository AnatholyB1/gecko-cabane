import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { validateReservationFields, isPartySizeValid, isReservationDateValid } from '@/utils/validation'

// GET: Fetch reservations (admin only, or by phone for customers)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const phone = searchParams.get('phone')
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  // If phone is provided, allow public to check their reservation
  if (phone) {
    const { data, error } = await supabase
      .from('reservations')
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
    .from('reservations')
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

// POST: Create a new reservation (public)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      reservation_date, 
      reservation_time, 
      party_size,
      occasion,
      phone_verification_token
    } = body
    
    // Validation
    const fieldError = validateReservationFields(body)
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 })
    }

    // Validate phone verification token
    if (!phone_verification_token) {
      return NextResponse.json(
        { error: 'Veuillez vérifier votre numéro de téléphone avant de soumettre.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const { data: verif, error: verifError } = await adminSupabase
      .from('phone_verifications')
      .select('id, phone, token_expires_at')
      .eq('verified_token', phone_verification_token)
      .single()

    if (verifError || !verif) {
      return NextResponse.json(
        { error: 'Code de vérification invalide. Veuillez vérifier à nouveau votre numéro.' },
        { status: 400 }
      )
    }

    if (new Date(verif.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Le code de vérification a expiré. Veuillez vérifier à nouveau votre numéro.' },
        { status: 400 }
      )
    }

    if (verif.phone !== customer_phone) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone ne correspond pas à la vérification.' },
        { status: 400 }
      )
    }

    // Consume the token (single-use)
    await adminSupabase
      .from('phone_verifications')
      .update({ verified_token: null, token_expires_at: null })
      .eq('id', verif.id)
    
    // Validate party size
    if (!isPartySizeValid(party_size)) {
      return NextResponse.json({ 
        error: 'Le nombre de personnes doit être entre 1 et 50' 
      }, { status: 400 })
    }
    
    // Validate date is not in the past
    if (!isReservationDateValid(reservation_date)) {
      return NextResponse.json({ 
        error: 'La date de réservation ne peut pas être dans le passé' 
      }, { status: 400 })
    }
    
    // Insert reservation
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_name,
        customer_email: customer_email || null,
        customer_phone,
        reservation_date,
        reservation_time,
        party_size,
        occasion: occasion || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Reservation error:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }
    
    // Send webhook notification
    const webhookUrl = process.env.NEXT_PUBLIC_RESA_HOOK_URL
    if (webhookUrl && data) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_reservation',
            reservation: {
              id: data.id,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              reservation_date: data.reservation_date,
              reservation_time: data.reservation_time,
              party_size: data.party_size,
              occasion: data.occasion,
              created_at: data.created_at
            }
          })
        })
      } catch (webhookError) {
        // Log but don't fail the reservation if webhook fails
        console.error('Webhook error:', webhookError)
      }
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('Reservation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
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
      .from('reservations')
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
    .from('reservations')
    .delete()
    .eq('id', id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
