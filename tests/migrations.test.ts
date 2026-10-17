/**
 * Static checks on supabase/migrations/*.sql
 *
 *  - every created table is gecko_-prefixed (the Supabase project is shared)
 *  - no permissive `using (true)` policy on PII tables
 *  - legacy unprefixed migrations 001-006 live in supabase/legacy/
 *  - 007 baseline covers every table the code references
 *  - file names form a strictly increasing 3-digit sequence starting at 007
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const read = (f: string) => readFileSync(join(MIGRATIONS_DIR, f), 'utf-8')

const REQUIRED_TABLES = [
  'gecko_opening_hours',
  'gecko_special_hours',
  'gecko_announcement',
  'gecko_restaurant_settings',
  'gecko_reservations',
  'gecko_tables',
  'gecko_table_configurations',
  'gecko_table_configuration_tables',
  'gecko_table_assignments',
  'gecko_menu_pages',
  'gecko_menu_categories',
  'gecko_menu_items',
  'gecko_admins',
  'gecko_phone_verifications',
]

describe('supabase migrations', () => {
  it('has at least the 007 baseline', () => {
    expect(files).toContain('007_gecko_baseline.sql')
  })

  it('every create table targets a gecko_ name', () => {
    const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?("?)([a-z0-9_]+)\1/gi
    for (const f of files) {
      for (const m of read(f).matchAll(re)) {
        expect(m[2], `${f}: ${m[2]}`).toMatch(/^gecko_/)
      }
    }
  })

  it('has no using (true) policy on PII tables', () => {
    const re =
      /create\s+policy[^;]*?\bon\s+(?:public\.)?(gecko_reservations|gecko_marketing_consents|gecko_rate_limits)\b[^;]*?using\s*\(\s*true\s*\)/gi
    for (const f of files) {
      expect(re.test(read(f)), `${f} has a public policy on a PII table`).toBe(false)
      re.lastIndex = 0
    }
  })

  it('does not keep legacy migrations 001-006', () => {
    expect(files.filter((f) => /^00[1-6]_/.test(f))).toEqual([])
  })

  it('uses a strictly increasing 3-digit sequence starting at 007', () => {
    const nums = files.map((f) => {
      const m = /^(\d{3})_[a-z0-9_]+\.sql$/.exec(f)
      expect(m, `bad migration file name: ${f}`).not.toBeNull()
      return Number(m![1])
    })
    nums.forEach((n, i) => {
      expect(n).toBe(7 + i)
    })
  })

  it('007 baseline covers admin helper, RLS and every referenced table', () => {
    const sql = read('007_gecko_baseline.sql')
    expect(sql).toContain('gecko_is_admin')
    expect(sql).toContain('gecko_admins')
    expect(sql).toMatch(/enable row level security/i)
    for (const t of REQUIRED_TABLES) {
      expect(sql, t).toMatch(new RegExp(`create table if not exists public\\.${t}\\b`, 'i'))
      expect(sql, `${t} RLS`).toMatch(
        new RegExp(`alter table public\\.${t}\\s+enable row level security`, 'i')
      )
    }
    expect(sql).toContain('gecko-menu-images')
  })

  it('012 drops only gecko_phone_verifications, without cascade', () => {
    const sql = read('012_drop_phone_verifications.sql').replace(/--.*$/gm, '')
    expect(sql).toMatch(/drop table if exists public\.gecko_phone_verifications;/i)
    expect(sql.match(/\bdrop\b/gi)).toHaveLength(1)
    expect(sql).not.toMatch(/cascade/i)
  })

  it('013 adds is_gluten_free (no backfill) and an inactive empty Belgian page', () => {
    const sql = read('013_menu_gluten_free.sql')
      .replace(/--.*$/gm, '')
      .toLowerCase()
    expect(sql).toContain(
      'add column if not exists is_gluten_free boolean not null default false'
    )
    expect(sql).not.toContain('update public.gecko_menu_items')
    expect(sql).not.toContain('is_gluten_free = true')
    expect(sql).toContain("'vins-bieres-belges'")
    expect(sql).toMatch(/false,\s*coalesce/)
    expect(sql).toContain('where not exists')
    expect(sql).not.toMatch(/insert\s+into\s+public\.gecko_menu_(categories|items)/)
  })

  it('014 adds review tracking columns and token idempotently, no status change', () => {
    const sql = read('014_review_invitations.sql')
      .replace(/--.*$/gm, '')
      .toLowerCase()
    expect(sql).toContain(
      'add column if not exists review_token uuid not null default gen_random_uuid()'
    )
    expect(sql).toContain('add column if not exists review_email_sent_at timestamptz')
    expect(sql).toContain('add column if not exists review_reminder_sent_at timestamptz')
    expect(sql).toContain('add column if not exists review_clicked_at timestamptz')
    expect(sql).toMatch(/create unique index if not exists[^;]*\(review_token\)/)
    expect(sql).not.toContain('update public.gecko_reservations')
    expect(sql).not.toContain('drop')
    expect(sql).not.toContain('check')
    expect(sql).not.toContain('create policy')
  })

  it('015 newsletter ledger is additive and service-role only', () => {
    expect(files).toContain('015_newsletter.sql')
    const sql = read('015_newsletter.sql')
      .replace(/--.*$/gm, '')
      .toLowerCase()
    for (const c of [
      'confirmation_sent_at',
      'confirmed_at',
      'country',
      'is_resident',
      'brevo_synced_at',
      'last_visit_synced',
    ]) {
      expect(sql, c).toContain(`add column if not exists ${c}`)
    }
    expect(sql).toContain('create table if not exists public.gecko_newsletter_events')
    expect(sql).toMatch(/alter table public\.gecko_newsletter_events\s+enable row level security/)
    expect(sql).toMatch(/revoke all on public\.gecko_newsletter_events from anon, authenticated/)
    expect(sql).toContain(
      'grant execute on function public.gecko_newsletter_count(text, text) to service_role'
    )
    expect(sql).not.toContain('drop table')
    expect(sql).not.toContain('delete from')
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/)
  })

  it('011 revokes anon DML on consents and keeps authenticated select', () => {
    const sql = read('011_revoke_anon_consents_dml.sql').replace(/--.*$/gm, '')
    expect(sql).toMatch(/revoke\s+insert,\s*update,\s*delete,\s*select\s+on\s+public\.gecko_marketing_consents\s+from\s+anon;/i)
    expect(sql).not.toMatch(/authenticated/i)
  })
})
