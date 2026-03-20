import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, seats, position_x, position_y, width, height, shape } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }
    if (!seats || typeof seats !== 'number' || seats < 1 || seats > 30) {
      return NextResponse.json({ error: 'Nombre de places invalide (1-30)' }, { status: 400 })
    }
    if (!['square', 'round', 'rectangle'].includes(shape)) {
      return NextResponse.json({ error: 'Forme invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tables')
      .insert({
        name: name.trim(),
        seats,
        position_x: position_x ?? 50,
        position_y: position_y ?? 50,
        width: width ?? 9,
        height: height ?? 11,
        shape: shape ?? 'square',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
