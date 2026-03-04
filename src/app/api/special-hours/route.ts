import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('special_hours')
      .select('*')
      .order('date', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { date, title, is_open, open_time, close_time, note } = body
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('special_hours')
      .upsert({
        date,
        title: title || null,
        is_open,
        open_time: is_open ? open_time : null,
        close_time: is_open ? close_time : null,
        note: note || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('special_hours')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
