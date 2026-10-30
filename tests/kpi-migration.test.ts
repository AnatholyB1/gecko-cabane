/**
 * Static checks on supabase/migrations/018_weekly_kpis.sql (phase 8, D-06).
 * The migration is a file only: it is applied after explicit owner approval.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '018_weekly_kpis.sql'),
  'utf-8',
)

describe('018_weekly_kpis.sql', () => {
  it('creates the gecko_weekly_kpis table with RLS enabled', () => {
    expect(sql).toContain('create table if not exists public.gecko_weekly_kpis')
    expect(sql).toContain('enable row level security')
  })

  it('restricts select/insert/update to gecko admins', () => {
    const count = sql.split('gecko_is_admin()').length - 1
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('revokes all privileges from anon and authenticated first', () => {
    expect(sql).toContain('revoke all on public.gecko_weekly_kpis from anon, authenticated')
  })

  it('has no permissive policy and no destructive statement', () => {
    expect(sql).not.toContain('using (true)')
    expect(sql).not.toMatch(/drop\s+table/i)
  })

  it('grants update only on manual-entry columns', () => {
    const m = sql.match(/grant update \(([^)]*)\)/)
    expect(m).not.toBeNull()
    const cols = m![1]
    for (const forbidden of [
      'report_sent_at',
      'alerts',
      'narrative',
      'gsc_',
      'tripadvisor_',
      'reservations_',
      'newsletter_',
    ]) {
      expect(cols).not.toContain(forbidden)
    }
    expect(cols).toContain('google_reviews_total')
  })

  it('grants insert only on manual-entry columns plus the week keys', () => {
    const m = sql.match(/grant insert \(([^)]*)\)/)
    expect(m).not.toBeNull()
    expect(m![1]).not.toContain('report_sent_at')
    expect(m![1]).toContain('week_start')
  })

  it('enforces Monday-to-Sunday weeks', () => {
    expect(sql).toContain('extract(isodow from week_start) = 1')
    expect(sql).toContain('week_end = week_start + 6')
  })
})
