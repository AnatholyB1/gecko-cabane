import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  selectSyncUpdates,
  selectLegacyConfirmations,
} from '../src/utils/newsletter-segments'
import { resolveActiveSubscribers, type LedgerRow } from '../src/utils/newsletter-ledger'
import { newsletterLegacyConfirmEmail } from '../src/utils/newsletter-emails'

const root = join(__dirname, '..')
const read = (...p: string[]) => readFileSync(join(root, ...p), 'utf-8')

function row(over: Partial<LedgerRow> = {}): LedgerRow {
  return {
    id: 1,
    email: 'eve@example.com',
    consent: true,
    source: 'footer',
    locale: 'fr',
    consented_at: '2026-10-01T10:00:00Z',
    confirmed_at: '2026-10-01T11:00:00Z',
    confirmation_sent_at: '2026-10-01T10:00:05Z',
    country: null,
    is_resident: false,
    contact_synced_at: '2026-10-01T11:00:01Z',
    last_visit_synced: null,
    reservation_id: null,
    ...over,
  }
}

const TODAY = '2026-10-20'

function res(over: Record<string, unknown> = {}) {
  return {
    customer_email: 'eve@example.com',
    reservation_date: '2026-10-17',
    customer_phone: '+33612345678',
    status: 'confirmed',
    ...over,
  }
}

describe('selectSyncUpdates', () => {
  it('emits last visit, country and resident from an honored reservation', () => {
    const actives = resolveActiveSubscribers([row()])
    const out = selectSyncUpdates(actives, [res()], TODAY)
    expect(out).toHaveLength(1)
    expect(out[0].profile.lastVisit).toBe('2026-10-17')
    expect(out[0].profile.country).toBe('FR')
    expect(out[0].profile.resident).toBe(false)
  })

  it('uses the latest reservation and a Thai phone marks resident', () => {
    const actives = resolveActiveSubscribers([row()])
    const out = selectSyncUpdates(
      actives,
      [res({ reservation_date: '2026-10-10' }), res({ reservation_date: '2026-10-18', customer_phone: '+66819585945' })],
      TODAY
    )
    expect(out[0].profile.lastVisit).toBe('2026-10-18')
    expect(out[0].profile.resident).toBe(true)
    expect(out[0].profile.country).toBe('TH')
  })

  it('ignores pending, cancelled, no_show and future reservations', () => {
    const actives = resolveActiveSubscribers([row()])
    const out = selectSyncUpdates(
      actives,
      [
        res({ status: 'pending' }),
        res({ status: 'cancelled' }),
        res({ status: 'no_show' }),
        res({ reservation_date: '2026-10-25' }),
      ],
      TODAY
    )
    expect(out).toEqual([])
  })

  it('emits nothing when values are already synced', () => {
    const actives = resolveActiveSubscribers([
      row({ last_visit_synced: '2026-10-17', country: 'FR', is_resident: false }),
    ])
    expect(selectSyncUpdates(actives, [res()], TODAY)).toEqual([])
  })

  it('emits nothing for a footer subscriber without reservation and no change', () => {
    const actives = resolveActiveSubscribers([row()])
    expect(selectSyncUpdates(actives, [], TODAY)).toEqual([])
  })

  it('matches emails case-insensitively', () => {
    const actives = resolveActiveSubscribers([row()])
    const out = selectSyncUpdates(actives, [res({ customer_email: 'EVE@Example.com' })], TODAY)
    expect(out).toHaveLength(1)
  })
})

describe('selectLegacyConfirmations', () => {
  const legacy = (over: Partial<LedgerRow>) =>
    row({
      source: 'reservation_form',
      confirmed_at: null,
      confirmation_sent_at: null,
      contact_synced_at: null,
      reservation_id: 5,
      ...over,
    })

  it('selects never-asked reservation-form consents, oldest first, capped', () => {
    const rows = [
      legacy({ id: 2, email: 'b@x.com', consented_at: '2026-09-02T10:00:00Z' }),
      legacy({ id: 1, email: 'a@x.com', consented_at: '2026-09-01T10:00:00Z' }),
      legacy({ id: 3, email: 'c@x.com', consented_at: '2026-09-03T10:00:00Z' }),
    ]
    const out = selectLegacyConfirmations(rows, 2)
    expect(out.map((r) => r.email)).toEqual(['a@x.com', 'b@x.com'])
  })

  it('skips already asked, active and withdrawn emails', () => {
    const rows = [
      legacy({ id: 1, email: 'asked@x.com', confirmation_sent_at: '2026-10-01T00:00:00Z' }),
      legacy({ id: 2, email: 'active@x.com', confirmed_at: '2026-10-01T00:00:00Z' }),
      legacy({ id: 3, email: 'gone@x.com', consented_at: '2026-09-01T00:00:00Z' }),
      row({ id: 4, email: 'gone@x.com', consent: false, consented_at: '2026-09-05T00:00:00Z', confirmed_at: null }),
      row({ id: 5, email: 'footer@x.com', confirmed_at: null, confirmation_sent_at: null }),
    ]
    expect(selectLegacyConfirmations(rows, 50)).toEqual([])
  })

  it('skips an email that was asked through another row', () => {
    const rows = [
      legacy({ id: 1, email: 'a@x.com', consented_at: '2026-09-01T00:00:00Z' }),
      row({ id: 2, email: 'a@x.com', source: 'footer', confirmed_at: null, consented_at: '2026-09-02T00:00:00Z' }),
    ]
    expect(selectLegacyConfirmations(rows, 50)).toEqual([])
  })

  it('returns one row per email', () => {
    const rows = [
      legacy({ id: 1, email: 'a@x.com', consented_at: '2026-09-01T00:00:00Z' }),
      legacy({ id: 2, email: 'A@x.com', consented_at: '2026-09-02T00:00:00Z' }),
    ]
    const out = selectLegacyConfirmations(rows, 50)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe(2)
  })
})

describe('newsletterLegacyConfirmEmail', () => {
  const urls = { confirm: 'https://x.test/c?r=1&s=a', unsubscribe: 'https://x.test/u?r=1' }
  it('fr explains the ticked box and the single reminder', () => {
    const m = newsletterLegacyConfirmEmail('fr', urls)
    expect(m.subject).toBe('Confirmez votre inscription à Gecko Cabane')
    expect(m.text).toContain('Lors de votre réservation, vous avez coché la case pour recevoir nos actualités.')
    expect(m.text).toContain('Nous ne vous écrirons plus si vous ne confirmez pas.')
    expect(m.text).toContain('30 jours')
    expect(m.html).toContain('Confirmer mon inscription')
    expect(m.html).toContain('PDPA')
    expect(m.html).toContain('https://x.test/u?r=1')
  })
  it('en is equivalent and escapes urls', () => {
    const m = newsletterLegacyConfirmEmail('en', urls)
    expect(m.subject).toBe('Confirm your Gecko Cabane subscription')
    expect(m.html).toContain('r=1&amp;s=a')
    expect(m.text).toContain('30 days')
    expect(m.html).toContain('GDPR')
  })
})

describe('cron wiring (source scan)', () => {
  const sync = () => read('src', 'app', 'api', 'cron', 'newsletter-sync', 'route.ts')
  const legacy = () => read('src', 'app', 'api', 'cron', 'newsletter-legacy-confirm', 'route.ts')

  it('both routes return 401 before any DB work', () => {
    for (const src of [sync(), legacy()]) {
      expect(src).toContain('CRON_SECRET')
      expect(src.indexOf('Unauthorized')).toBeGreaterThan(-1)
      expect(src.indexOf('Unauthorized')).toBeLessThan(src.indexOf('createAdminClient()'))
    }
  })

  it('sync route mirrors contacts, sends only when enabled, supports dry run', () => {
    const src = sync()
    expect(src).toContain('updateResendContactProperties(')
    expect(src).toContain('NEWSLETTER_SEQUENCES_ENABLED')
    expect(src).toContain('NEWSLETTER_CAMPAIGNS_ENABLED')
    expect(src).toContain("'dry'")
    // claim in the send log before sending, release on failure
    expect(src.indexOf('.insert({ email: p.email.toLowerCase()')).toBeLessThan(src.indexOf('resend.emails.send'))
    expect(src).toContain('.delete()')
    expect(src).not.toMatch(/brevo/i)
  })

  it('legacy route claims before sending and resets on failure', () => {
    const src = legacy()
    expect(src).toContain(".is('confirmation_sent_at', null)")
    expect(src).toContain('confirmation_sent_at: null')
    expect(src).toContain('newsletterLegacyConfirmEmail(')
    expect(src).toContain("'dry'")
    expect(src.indexOf(".is('confirmation_sent_at', null)")).toBeLessThan(
      src.indexOf('newsletterLegacyConfirmEmail(')
    )
  })

  it('vercel.json schedules the sync only', () => {
    const v = JSON.parse(read('vercel.json')) as { crons: { path: string; schedule: string }[] }
    expect(
      v.crons.some((c) => c.path === '/api/cron/newsletter-sync' && c.schedule === '0 11 * * *')
    ).toBe(true)
    expect(v.crons.some((c) => c.path === '/api/cron/review-invitations')).toBe(true)
    expect(JSON.stringify(v)).not.toContain('newsletter-legacy-confirm')
  })
})
