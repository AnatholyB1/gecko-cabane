import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/tables/assignments
 *
 * Mode A — fetch assignments for a date:
 *   ?date=YYYY-MM-DD
 *   Returns all table_assignments for reservations on that date, with config + reservation details.
 *
 * Mode B — check configuration availability:
 *   ?datetime=ISO&party_size=N[&exclude_reservation_id=N]
 *   Returns all active configurations with an `available` flag.
 *   A configuration is unavailable if any of its physical tables are blocked at the given datetime.
 *   (blocked = belongs to a config with an assignment where blocked_until > datetime and reservation starts before datetime)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = request.nextUrl

    // -----------------------------------------------------------------------
    // Mode B: availability check
    // -----------------------------------------------------------------------
    const datetimeParam      = searchParams.get('datetime')
    const partySizeParam     = searchParams.get('party_size')
    const excludeResParam    = searchParams.get('exclude_reservation_id')

    if (datetimeParam && partySizeParam) {
      const partySize = parseInt(partySizeParam, 10)
      if (isNaN(partySize) || partySize < 1) {
        return NextResponse.json({ error: 'party_size invalide' }, { status: 400 })
      }

      const checkDatetime = new Date(datetimeParam)
      if (isNaN(checkDatetime.getTime())) {
        return NextResponse.json({ error: 'datetime invalide' }, { status: 400 })
      }

      const excludeResId = excludeResParam ? parseInt(excludeResParam, 10) : null

      // Fetch all active configurations + their tables
      const { data: configRows, error: cfgErr } = await supabase
        .from('table_configurations')
        .select('*')
        .eq('is_active', true)
        .order('id')

      if (cfgErr) return NextResponse.json({ error: cfgErr.message }, { status: 500 })

      const { data: junctions, error: juncErr } = await supabase
        .from('table_configuration_tables')
        .select('table_configuration_id, table_id, tables(*)')

      if (juncErr) return NextResponse.json({ error: juncErr.message }, { status: 500 })

      // Find currently blocked physical table IDs at checkDatetime
      // A table is blocked if it belongs to a config with an active assignment where:
      //   reservation_datetime <= checkDatetime < blocked_until
      const { data: activeAssignments, error: asgErr } = await supabase
        .from('table_assignments')
        .select('table_configuration_id, blocked_until, reservation_id, reservations(reservation_date, reservation_time)')
        .gt('blocked_until', checkDatetime.toISOString())

      if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

      // Collect table_ids from blocked configurations
      const blockedTableIds = new Set<number>()
      const currentlyAssignedConfigId: number | null = (() => {
        if (!excludeResId) return null
        const own = (activeAssignments ?? []).find((a) => a.reservation_id === excludeResId)
        return own ? own.table_configuration_id : null
      })()

      for (const asg of activeAssignments ?? []) {
        if (asg.reservation_id === excludeResId) continue // skip the reservation being re-assigned

        const resRow = (asg.reservations as unknown) as { reservation_date: string; reservation_time: string } | null
        if (!resRow) continue

        const resDatetime = new Date(`${resRow.reservation_date}T${resRow.reservation_time}`)
        if (resDatetime <= checkDatetime) {
          // This assignment's block window has started — collect its physical tables
          const juncForConfig = (junctions ?? []).filter(
            (j) => j.table_configuration_id === asg.table_configuration_id
          )
          for (const j of juncForConfig) blockedTableIds.add(j.table_id)
        }
      }

      // Build result with availability flag per configuration
      // Only include configs that can seat the party (max_capacity >= party_size)
      const data = (configRows ?? []).map((cfg) => {
        const cfgTables = (junctions ?? [])
          .filter((j) => j.table_configuration_id === cfg.id)
          .flatMap((j) => {
            const t = j.tables
            if (!t) return []
            return Array.isArray(t) ? t : [t]
          }) as Array<{ id: number }>

        const tableIds = cfgTables.map((t) => t.id)
        const blocked  = tableIds.some((tid) => blockedTableIds.has(tid))

        return {
          configuration: { ...cfg, tables: cfgTables },
          available: !blocked && cfg.max_capacity >= partySize,
          assigned_to_current: cfg.id === currentlyAssignedConfigId,
        }
      })

      return NextResponse.json({ data })
    }

    // -----------------------------------------------------------------------
    // Mode A: assignments for a specific date
    // -----------------------------------------------------------------------
    const dateParam = searchParams.get('date')
    if (!dateParam) {
      return NextResponse.json({ error: 'Paramètre date ou datetime requis' }, { status: 400 })
    }

    const { data: assignments, error: asgErr } = await supabase
      .from('table_assignments')
      .select(`
        *,
        reservations(*),
        table_configurations(
          *,
          table_configuration_tables(table_id, tables(*))
        )
      `)
      .filter('reservations.reservation_date', 'eq', dateParam)

    if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

    // Normalize nested structure
    const data = (assignments ?? []).map((a) => {
      const cfg = a.table_configurations as Record<string, unknown>
      const tablePairs = (cfg?.table_configuration_tables ?? []) as Array<{ tables: unknown }>
      return {
        ...a,
        configuration: {
          ...cfg,
          tables: tablePairs.map((tp) => tp.tables).filter(Boolean),
        },
        reservation: a.reservations,
      }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/tables/assignments
 * Body: { reservation_id, table_configuration_id }
 *
 * Reads `table_block_duration_minutes` from restaurant_settings to compute blocked_until.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { reservation_id, table_configuration_id } = body

    if (!reservation_id || !table_configuration_id) {
      return NextResponse.json({ error: 'reservation_id et table_configuration_id requis' }, { status: 400 })
    }

    // Fetch the reservation to get its datetime
    const { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .select('reservation_date, reservation_time')
      .eq('id', reservation_id)
      .single()

    if (resErr || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    // Read block duration from settings
    const { data: setting } = await supabase
      .from('restaurant_settings')
      .select('value')
      .eq('key', 'table_block_duration_minutes')
      .single()

    const blockMinutes = setting ? parseInt(setting.value, 10) : 120

    const resDatetime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
    const blockedUntil = new Date(resDatetime.getTime() + blockMinutes * 60 * 1000)

    // Upsert (replace existing assignment for this reservation)
    const { data, error } = await supabase
      .from('table_assignments')
      .upsert(
        { reservation_id, table_configuration_id, blocked_until: blockedUntil.toISOString() },
        { onConflict: 'reservation_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/tables/assignments?id=N  or  ?reservation_id=N
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const id            = searchParams.get('id')
    const reservationId = searchParams.get('reservation_id')

    let q = supabase.from('table_assignments').delete()
    if (id)            q = q.eq('id', parseInt(id, 10))
    else if (reservationId) q = q.eq('reservation_id', parseInt(reservationId, 10))
    else return NextResponse.json({ error: 'id ou reservation_id requis' }, { status: 400 })

    const { error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
