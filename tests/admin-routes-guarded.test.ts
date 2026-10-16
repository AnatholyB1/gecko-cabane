/**
 * Admin route guard scan (SEC-03)
 *
 * Source-level check that every mutating handler of the admin API routes uses
 * requireAdmin() (401 anonymous / 403 non-gecko-admin), that no bare
 * auth.getUser() guard remains, and that raw Supabase error messages are not
 * returned to clients.
 *
 * Plan 01-06 appends 'src/app/api/reservations/route.ts' to this list.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const GUARDED_ROUTE_FILES = [
  'src/app/api/announcement/route.ts',
  'src/app/api/hours/route.ts',
  'src/app/api/special-hours/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/menu/categories/route.ts',
  'src/app/api/menu/items/route.ts',
  'src/app/api/menu/pages/route.ts',
  'src/app/api/menu/reorder/route.ts',
  'src/app/api/menu/upload/route.ts',
  'src/app/api/tables/route.ts',
  'src/app/api/tables/[id]/route.ts',
  'src/app/api/tables/assignments/route.ts',
  'src/app/api/tables/configurations/route.ts',
  'src/app/api/tables/configurations/[id]/route.ts',
  'src/app/api/reservations/route.ts',
]

function read(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf-8')
}

function count(source: string, needle: string): number {
  return source.split(needle).length - 1
}

describe('admin routes are guarded by requireAdmin()', () => {
  it('every file calls requireAdmin() and has no bare auth.getUser()', () => {
    const offenders = GUARDED_ROUTE_FILES.filter((f) => {
      const src = read(f)
      return !src.includes('requireAdmin()') || src.includes('auth.getUser()')
    })
    expect(offenders, `Files missing requireAdmin() or still using auth.getUser(): ${offenders.join(', ')}`).toHaveLength(0)
  })

  it('requireAdmin() calls >= number of mutating handlers', () => {
    const offenders = GUARDED_ROUTE_FILES.filter((f) => {
      const src = read(f)
      const mutating = (src.match(/export async function (POST|PUT|PATCH|DELETE)\b/g) ?? []).length
      return count(src, 'requireAdmin()') < mutating
    })
    expect(offenders, `Mutating handlers without guard in: ${offenders.join(', ')}`).toHaveLength(0)
  })

  it('GET /api/tables/assignments is admin-only (returns reservation PII)', () => {
    const src = read('src/app/api/tables/assignments/route.ts')
    const start = src.indexOf('export async function GET')
    const next = src.indexOf('export async function', start + 1)
    const body = src.slice(start, next === -1 ? undefined : next)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(body.includes('requireAdmin()'), 'GET in tables/assignments must call requireAdmin()').toBe(true)
  })

  it('reservations route: GET, PUT, DELETE call requireAdmin(); POST does not', () => {
    const src = read('src/app/api/reservations/route.ts')
    const handler = (verb: string) => {
      const start = src.indexOf(`export async function ${verb}`)
      expect(start, `${verb} handler missing`).toBeGreaterThanOrEqual(0)
      const next = src.indexOf('export async function', start + 1)
      return src.slice(start, next === -1 ? undefined : next)
    }
    for (const verb of ['GET', 'PUT', 'DELETE']) {
      expect(handler(verb).includes('requireAdmin()'), `${verb} must call requireAdmin()`).toBe(true)
    }
    expect(handler('POST').includes('requireAdmin()'), 'POST is public').toBe(false)
  })

  it('no route returns raw Supabase error.message to the client', () => {
    const offenders = GUARDED_ROUTE_FILES.filter((f) =>
      /NextResponse\.json\(\s*\{[^}]*error:[^}]*\.message/.test(read(f))
    )
    expect(offenders, `Raw error.message leaked in: ${offenders.join(', ')}`).toHaveLength(0)
  })
})
