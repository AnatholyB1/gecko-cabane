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
    const cfgId = parseInt(id, 10)
    if (isNaN(cfgId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const body = await request.json()
    const { name, min_capacity, max_capacity, table_ids, is_active } = body

    // Update configuration fields
    const update: Record<string, unknown> = {}
    if (name !== undefined)         update.name = (name as string).trim()
    if (min_capacity !== undefined)  update.min_capacity = min_capacity
    if (max_capacity !== undefined)  update.max_capacity = max_capacity
    if (is_active !== undefined)     update.is_active = is_active

    if (Object.keys(update).length > 0) {
      const { error } = await supabase
        .from('gecko_table_configurations')
        .update(update)
        .eq('id', cfgId)
      if (error) {
        Sentry.captureException(error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // Replace junction rows when table_ids provided
    if (Array.isArray(table_ids)) {
      await supabase.from('gecko_table_configuration_tables').delete().eq('table_configuration_id', cfgId)
      if (table_ids.length > 0) {
        const junctions = (table_ids as number[]).map((tid) => ({
          table_configuration_id: cfgId,
          table_id: tid,
        }))
        const { error: juncErr } = await supabase.from('gecko_table_configuration_tables').insert(junctions)
        if (juncErr) {
          Sentry.captureException(juncErr)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
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
    const cfgId = parseInt(id, 10)
    if (isNaN(cfgId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const { error } = await supabase.from('gecko_table_configurations').delete().eq('id', cfgId)
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
