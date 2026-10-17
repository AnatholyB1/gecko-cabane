import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseBrevoWebhookEvents, tokenMatches } from '../src/utils/newsletter-withdrawal'

const route = readFileSync(
  join(__dirname, '..', 'src', 'app', 'api', 'webhooks', 'brevo', 'route.ts'),
  'utf-8'
)

describe('parseBrevoWebhookEvents', () => {
  it('maps unsubscribe-like events to withdrawals', () => {
    const ts = Math.floor(Date.now() / 1000) - 60
    for (const event of ['unsubscribed', 'unsubscribe', 'spam']) {
      const out = parseBrevoWebhookEvents({ event, email: 'Jean@Gmail.com', ts_event: ts })
      expect(out).toEqual([
        { kind: 'withdraw', email: 'jean@gmail.com', at: new Date(ts * 1000).toISOString() },
      ])
    }
  })
  it('ignores other events', () => {
    expect(parseBrevoWebhookEvents({ event: 'opened', email: 'a@b.co' })).toEqual([])
  })
  it('handles arrays and skips invalid emails', () => {
    const out = parseBrevoWebhookEvents([
      { event: 'unsubscribed', email: 'a@b.co' },
      { event: 'spam', email: 'c@d.co' },
      { event: 'spam', email: 'nope' },
      { event: 'spam' },
    ])
    expect(out).toHaveLength(2)
  })
  it('falls back to now for missing or absurd timestamps', () => {
    const before = Date.now()
    const missing = parseBrevoWebhookEvents({ event: 'spam', email: 'a@b.co' })
    const old = parseBrevoWebhookEvents({ event: 'spam', email: 'a@b.co', ts_event: 1000 })
    const future = parseBrevoWebhookEvents({
      event: 'spam',
      email: 'a@b.co',
      ts_event: Math.floor(Date.now() / 1000) + 10 * 86400,
    })
    for (const o of [missing, old, future]) {
      expect(Date.parse(o[0].at)).toBeGreaterThanOrEqual(before - 1000)
      expect(Date.parse(o[0].at)).toBeLessThanOrEqual(Date.now() + 1000)
    }
  })
  it('returns [] for non-object input', () => {
    for (const v of [null, undefined, 'x', 42]) expect(parseBrevoWebhookEvents(v)).toEqual([])
  })
})

describe('tokenMatches', () => {
  it('compares in constant time semantics', () => {
    expect(tokenMatches('secret', 'secret')).toBe(true)
    expect(tokenMatches('secret', 'secreT')).toBe(false)
    expect(tokenMatches('secret', 'secret2')).toBe(false)
    expect(tokenMatches('secret', null)).toBe(false)
    expect(tokenMatches('', '')).toBe(false)
  })
})

describe('webhook route wiring', () => {
  it('exports POST only', () => {
    expect(route).toMatch(/export async function POST/)
    expect(route).not.toMatch(/export async function (GET|PUT|PATCH|DELETE)/)
  })
  it('checks the token before reading the body', () => {
    expect(route).toContain('tokenMatches')
    expect(route).toContain('401')
    expect(route.indexOf('tokenMatches')).toBeLessThan(route.indexOf('request.json'))
  })
  it('never calls Brevo and writes brevo_webhook rows', () => {
    expect(route).not.toContain('blacklistBrevoContact')
    expect(route).not.toContain('upsertBrevoContact')
    expect(route).toContain('brevo_webhook')
  })
})
