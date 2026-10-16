import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth

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
      .from('gecko_tables')
      .update(update)
      .eq('id', tableId)
      .select()
      .single()

    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth

    const { id } = await params
    const tableId = parseInt(id, 10)
    if (isNaN(tableId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const { error } = await supabase.from('gecko_tables').delete().eq('id', tableId)
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
