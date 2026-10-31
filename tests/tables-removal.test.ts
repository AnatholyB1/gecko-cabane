/**
 * Phase 10 (TAB-01, TAB-06): the floor plan / table placement feature is gone,
 * and booking + availability never depend on a table object.
 * The gecko_table* SQL tables stay in the database (no migration).
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { hasCapacity } from '../src/utils/reservation-rules'

const root = join(__dirname, '..')
const read = (f: string) => readFileSync(join(root, f), 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// A table OBJECT reference: gecko_table* SQL names, /api/tables, table assignment/config types.
const TABLE_OBJECT =
  /gecko_tables?\b|gecko_table_|\/api\/tables|table_assignment|table_configuration|TableAssignment|TableConfiguration|RestaurantTable|ConfigAvailability/i

describe('TAB-01 booking and availability reference no table object', () => {
  const sources = {
    'POST/PUT reservations route': read('src/app/api/reservations/route.ts'),
    'manual reservation route': read('src/app/api/reservations/manual/route.ts'),
    'reservation rules (availability)': read('src/utils/reservation-rules.ts'),
    'MCP route (check_availability)': read('src/app/api/mcp/route.ts'),
  }
  for (const [name, src] of Object.entries(sources)) {
    it(`${name} has no table object`, () => {
      expect(src).not.toMatch(TABLE_OBJECT)
    })
  }

  it('gecko_create_reservation (SQL) sums covers vs max_covers and never reads gecko_table*', () => {
    const sql = read('supabase/migrations/008_reservation_booking.sql')
    const start = sql.indexOf('function public.gecko_create_reservation')
    const body = sql.slice(start)
    expect(start).toBeGreaterThan(0)
    expect(body).toContain("'max_covers'")
    expect(body).toContain('v_used + p_party > v_max')
    expect(body).toMatch(/else 40 end/)
    expect(body).not.toMatch(/gecko_tables?\b|gecko_table_/)
  })

  it('40 covers fit, the 41st is refused', () => {
    expect(hasCapacity(0, 40, 40)).toBe(true)
    expect(hasCapacity(39, 1, 40)).toBe(true)
    expect(hasCapacity(40, 1, 40)).toBe(false)
    expect(hasCapacity(0, 41, 40)).toBe(false)
    expect(hasCapacity(30, 11, 40)).toBe(false)
  })
})

describe('TAB-06 the floor plan feature stays removed', () => {
  it('has no admin/tables page and no api/tables route', () => {
    expect(existsSync(join(root, 'src/app/admin/tables'))).toBe(false)
    expect(existsSync(join(root, 'src/app/api/tables'))).toBe(false)
  })

  it('no source file links to or fetches /admin/tables or /api/tables', () => {
    const offenders = walk(join(root, 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /\/(admin|api)\/tables/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('database.ts has no table floor-plan types', () => {
    expect(read('src/types/database.ts')).not.toMatch(
      /RestaurantTable|TableShape|TableConfiguration|TableAssignment|ConfigAvailability/
    )
  })

  it('capacity settings keep their keys and no longer say "table"', () => {
    const src = read('src/app/admin/settings/page.tsx')
    expect(src).toContain('table_block_duration_minutes')
    expect(src).toContain('max_covers')
    expect(src).toContain("Durée d\\'occupation d\\'un créneau")
    const labels = [...src.matchAll(/(?:label|description): '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1])
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.filter((l) => /\btables?\b/i.test(l))).toEqual([])
  })

  it('SQL gecko_table* tables are still in the baseline (no migration drops them)', () => {
    const dir = join(root, 'supabase/migrations')
    const all = readdirSync(dir)
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n')
    expect(all).toMatch(/create table[^;]*gecko_tables/i)
    expect(all).not.toMatch(/drop table[^;]*gecko_table/i)
  })
})
