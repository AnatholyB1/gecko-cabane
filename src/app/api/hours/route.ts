import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { OPENING_HOURS_TAG } from '@/utils/opening-hours'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('gecko_opening_hours')
      .select('*')
      .order('day_of_week', { ascending: true })
    
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
    
    const body = await request.json()
    const { hours } = body
    
    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Update each day's hours
    for (const hour of hours) {
      const { error } = await supabase
        .from('gecko_opening_hours')
        .update({
          is_open: hour.is_open,
          open_time: hour.is_open ? hour.open_time : null,
          close_time: hour.is_open ? hour.close_time : null,
          updated_at: new Date().toISOString()
        })
        .eq('day_of_week', hour.day_of_week)
      
      if (error) {
        Sentry.captureException(error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // Schema hours follow the admin within one request cycle (D-05)
    revalidateTag(OPENING_HOURS_TAG, 'max')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
