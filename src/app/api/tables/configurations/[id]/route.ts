import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
        .from('table_configurations')
        .update(update)
        .eq('id', cfgId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Replace junction rows when table_ids provided
    if (Array.isArray(table_ids)) {
      await supabase.from('table_configuration_tables').delete().eq('table_configuration_id', cfgId)
      if (table_ids.length > 0) {
        const junctions = (table_ids as number[]).map((tid) => ({
          table_configuration_id: cfgId,
          table_id: tid,
        }))
        const { error: juncErr } = await supabase.from('table_configuration_tables').insert(junctions)
        if (juncErr) return NextResponse.json({ error: juncErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
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
    const cfgId = parseInt(id, 10)
    if (isNaN(cfgId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

    const { error } = await supabase.from('table_configurations').delete().eq('id', cfgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
