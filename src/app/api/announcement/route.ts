import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('announcement')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (error) {
      // If table doesn't exist yet, return default
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json({ 
          data: {
            id: 1,
            title: '',
            content: '',
            is_active: false,
            bg_color: 'amber',
            start_date: null,
            end_date: null
          }
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, content, is_active, bg_color, start_date, end_date } = body
    
    const { data, error } = await supabase
      .from('announcement')
      .upsert({
        id: 1,
        title: title || null,
        content: content || '',
        is_active: is_active ?? false,
        bg_color: bg_color || 'amber',
        start_date: start_date || null,
        end_date: end_date || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
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
