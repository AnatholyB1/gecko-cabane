import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/** Fetch all configurations, each including their physical tables. */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: configs, error: cfgErr } = await supabase
      .from('table_configurations')
      .select('*')
      .order('id', { ascending: true })

    if (cfgErr) return NextResponse.json({ error: cfgErr.message }, { status: 500 })

    // Fetch junction rows + tables for each config
    const { data: junctions, error: juncErr } = await supabase
      .from('table_configuration_tables')
      .select('table_configuration_id, table_id, tables(*)')

    if (juncErr) return NextResponse.json({ error: juncErr.message }, { status: 500 })

    // Attach tables array to each config
    const data = (configs ?? []).map((cfg) => ({
      ...cfg,
      tables: (junctions ?? [])
        .filter((j) => j.table_configuration_id === cfg.id)
        .map((j) => j.tables)
        .filter(Boolean),
    }))

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Create a new configuration (with its associated table_ids). */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, min_capacity, max_capacity, table_ids } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }
    if (typeof min_capacity !== 'number' || min_capacity < 1) {
      return NextResponse.json({ error: 'min_capacity invalide' }, { status: 400 })
    }
    if (typeof max_capacity !== 'number' || max_capacity < min_capacity) {
      return NextResponse.json({ error: 'max_capacity doit être ≥ min_capacity' }, { status: 400 })
    }
    if (!Array.isArray(table_ids) || table_ids.length === 0) {
      return NextResponse.json({ error: 'Au moins une table est requise' }, { status: 400 })
    }

    const { data: cfg, error: cfgErr } = await supabase
      .from('table_configurations')
      .insert({ name: name.trim(), min_capacity, max_capacity })
      .select()
      .single()

    if (cfgErr) return NextResponse.json({ error: cfgErr.message }, { status: 500 })

    const junctions = (table_ids as number[]).map((tid) => ({
      table_configuration_id: cfg.id,
      table_id: tid,
    }))
    const { error: juncErr } = await supabase.from('table_configuration_tables').insert(junctions)
    if (juncErr) return NextResponse.json({ error: juncErr.message }, { status: 500 })

    return NextResponse.json({ data: cfg }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
