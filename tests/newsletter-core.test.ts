import { describe, it, expect } from 'vitest'
import {
  subscribeRequestSchema,
  NEWSLETTER_CONSENT_VERSION,
  GEO_ALLOWED_SOURCES,
  sanitizeGeoCountry,
  firstNewsletterErrorCode,
} from '../src/utils/newsletter-schema'
import {
  resolveEmailState,
  decideSubscribeAction,
  canConfirmRow,
  groupByEmail,
  resolveActiveSubscribers,
  type LedgerRow,
} from '../src/utils/newsletter-ledger'

const valid = { email: '  Foo@Example.COM ', locale: 'fr', source: 'footer', consent: true }

describe('subscribe schema', () => {
  it('parses a valid payload with normalised email and resident default', () => {
    const r = subscribeRequestSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.email).toBe('foo@example.com')
      expect(r.data.resident).toBe(false)
    }
  })
  it('accepts sv', () => {
    expect(subscribeRequestSchema.safeParse({ ...valid, locale: 'sv' }).success).toBe(true)
  })
  it('error codes', () => {
    const code = (p: unknown) => {
      const r = subscribeRequestSchema.safeParse(p)
      return r.success ? null : firstNewsletterErrorCode(r.error)
    }
    expect(code({ ...valid, consent: false })).toBe('consent')
    expect(code({ ...valid, email: 'nope' })).toBe('email')
    expect(code({ ...valid, locale: 'it' })).toBe('invalid')
    expect(code({ ...valid, source: 'reservation_form' })).toBe('invalid')
  })
  it('constants', () => {
    expect(NEWSLETTER_CONSENT_VERSION).toBe('newsletter-2026-10-17')
    expect([...GEO_ALLOWED_SOURCES]).toEqual(['footer', 'popup', 'newsletter_page'])
  })
  it('sanitizeGeoCountry', () => {
    expect(sanitizeGeoCountry('TH')).toBe('TH')
    expect(sanitizeGeoCountry('th')).toBeNull()
    expect(sanitizeGeoCountry('XX1')).toBeNull()
    expect(sanitizeGeoCountry(null)).toBeNull()
  })
})

let nextId = 1
const row = (over: Partial<LedgerRow> & { consented_at: string }): LedgerRow => ({
  id: nextId++,
  email: 'a@b.com',
  consent: true,
  source: 'footer',
  locale: 'fr',
  confirmed_at: null,
  confirmation_sent_at: null,
  country: null,
  is_resident: false,
  contact_synced_at: null,
  last_visit_synced: null,
  reservation_id: null,
  ...over,
})
const T = (h: number) => `2026-10-17T${String(h).padStart(2, '0')}:00:00.000Z`

describe('ledger state', () => {
  it('none for no rows', () => {
    expect(resolveEmailState([]).status).toBe('none')
  })
  it('pending for an unconfirmed consent', () => {
    expect(resolveEmailState([row({ consented_at: T(1) })]).status).toBe('pending')
  })
  it('active for a confirmed consent', () => {
    expect(resolveEmailState([row({ consented_at: T(1), confirmed_at: T(2) })]).status).toBe('active')
  })
  it('withdrawn after confirmed then withdrawal', () => {
    const s = resolveEmailState([
      row({ consented_at: T(1), confirmed_at: T(2) }),
      row({ consented_at: T(3), consent: false, source: 'unsubscribe_link' }),
    ])
    expect(s.status).toBe('withdrawn')
    expect(s.lastWithdrawalAt).toBe(T(3))
  })
  it('pending on re-subscribe after withdrawal', () => {
    expect(
      resolveEmailState([
        row({ consented_at: T(1), confirmed_at: T(2) }),
        row({ consented_at: T(3), consent: false }),
        row({ consented_at: T(4) }),
      ]).status
    ).toBe('pending')
  })
  it('active on confirmed re-subscribe after withdrawal', () => {
    expect(
      resolveEmailState([
        row({ consented_at: T(1), confirmed_at: T(2) }),
        row({ consented_at: T(3), consent: false }),
        row({ consented_at: T(4), confirmed_at: T(5) }),
      ]).status
    ).toBe('active')
  })
  it('stays active on a later unconfirmed attempt', () => {
    expect(
      resolveEmailState([
        row({ consented_at: T(1), confirmed_at: T(2) }),
        row({ consented_at: T(3) }),
      ]).status
    ).toBe('active')
  })
  it('compares emails case-insensitively via groupByEmail', () => {
    const g = groupByEmail([
      row({ email: 'A@B.com', consented_at: T(1), confirmed_at: T(2) }),
      row({ email: 'a@b.COM', consented_at: T(3), consent: false }),
    ])
    expect(g.size).toBe(1)
    expect(resolveEmailState(g.get('a@b.com')!).status).toBe('withdrawn')
  })
  it('resolveActiveSubscribers returns active emails only', () => {
    const m = resolveActiveSubscribers([
      row({ email: 'x@y.com', consented_at: T(1), confirmed_at: T(2) }),
      row({ email: 'p@y.com', consented_at: T(1) }),
    ])
    expect([...m.keys()]).toEqual(['x@y.com'])
  })
})

describe('decideSubscribeAction', () => {
  const now = Date.parse(T(12))
  it('skip_active', () => {
    const s = resolveEmailState([row({ consented_at: T(1), confirmed_at: T(2) })])
    expect(decideSubscribeAction(s, now)).toBe('skip_active')
  })
  it('skip_recent_pending within 24h', () => {
    const s = resolveEmailState([row({ consented_at: T(9), confirmation_sent_at: T(10) })])
    expect(decideSubscribeAction(s, now)).toBe('skip_recent_pending')
  })
  it('create when pending sent 25h ago', () => {
    const s = resolveEmailState([
      row({ consented_at: T(9), confirmation_sent_at: new Date(now - 25 * 3600_000).toISOString() }),
    ])
    expect(decideSubscribeAction(s, now)).toBe('create')
  })
  it('create for none; never for a withdrawn address', () => {
    expect(decideSubscribeAction(resolveEmailState([]), now)).toBe('create')
    const w = resolveEmailState([
      row({ consented_at: T(1), confirmed_at: T(2) }),
      row({ consented_at: T(3), consent: false }),
    ])
    expect(decideSubscribeAction(w, now)).toBe('skip_withdrawn')
  })
})

describe('canConfirmRow', () => {
  it('false when a later withdrawal exists', () => {
    const a = row({ consented_at: T(1) })
    const w = row({ consented_at: T(2), consent: false })
    expect(canConfirmRow([a, w], a.id)).toBe(false)
  })
  it('false for a consent=false row', () => {
    const w = row({ consented_at: T(2), consent: false })
    expect(canConfirmRow([w], w.id)).toBe(false)
  })
  it('true otherwise', () => {
    const a = row({ consented_at: T(3) })
    const w = row({ consented_at: T(2), consent: false })
    expect(canConfirmRow([a, w], a.id)).toBe(true)
  })
  it('false for an unknown row', () => {
    expect(canConfirmRow([], 999)).toBe(false)
  })
})
