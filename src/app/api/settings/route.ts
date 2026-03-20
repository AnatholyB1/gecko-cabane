import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .order('key')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/settings
 * Body: { key: value, ... } — partial updates supported
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
    }

    const allowed = ['table_block_duration_minutes', 'max_covers']
    const errors: string[] = []

    for (const [key, value] of Object.entries(body)) {
      if (!allowed.includes(key)) continue
      const numVal = parseInt(String(value), 10)
      if (isNaN(numVal) || numVal < 1) {
        errors.push(`Valeur invalide pour ${key}`)
        continue
      }
      const { error } = await supabase
        .from('restaurant_settings')
        .update({ value: String(numVal) })
        .eq('key', key)
      if (error) errors.push(error.message)
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
