import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const tableId = parseInt(id, 10)
    if (isNaN(tableId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const body = await request.json()
    const allowed = ['name', 'seats', 'position_x', 'position_y', 'width', 'height', 'shape', 'is_active', 'display_order']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    if (update.name && typeof update.name === 'string') update.name = (update.name as string).trim()
    if ('seats' in update && (typeof update.seats !== 'number' || (update.seats as number) < 1)) {
      return NextResponse.json({ error: 'Nombre de places invalide' }, { status: 400 })
    }
    if ('shape' in update && !['square', 'round', 'rectangle'].includes(update.shape as string)) {
      return NextResponse.json({ error: 'Forme invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tables')
      .update(update)
      .eq('id', tableId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const tableId = parseInt(id, 10)
    if (isNaN(tableId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const { error } = await supabase.from('tables').delete().eq('id', tableId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
