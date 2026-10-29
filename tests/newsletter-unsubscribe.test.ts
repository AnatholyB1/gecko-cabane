import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { maskEmail, buildWithdrawalRow } from '../src/utils/newsletter-withdrawal'
import { NEWSLETTER_CONSENT_VERSION } from '../src/utils/newsletter-schema'

const root = join(__dirname, '..', 'src')
const read = (...p: string[]) => readFileSync(join(root, ...p), 'utf-8')

describe('maskEmail', () => {
  it('masks the local part', () => {
    expect(maskEmail('jean.dupont@gmail.com')).toBe('j***@gmail.com')
    expect(maskEmail('a@b.co')).toBe('a***@b.co')
  })
  it('returns *** for invalid input', () => {
    expect(maskEmail('not-an-email')).toBe('***')
    expect(maskEmail('@x.com')).toBe('***')
    expect(maskEmail('')).toBe('***')
  })
})

describe('buildWithdrawalRow', () => {
  it('builds a consent=false ledger row', () => {
    const at = '2026-10-17T10:00:00.000Z'
    expect(
      buildWithdrawalRow({ email: 'a@b.co', locale: 'fr', source: 'unsubscribe_link', at })
    ).toEqual({
      email: 'a@b.co',
      consent: false,
      locale: 'fr',
      source: 'unsubscribe_link',
      consent_text_version: NEWSLETTER_CONSENT_VERSION,
      consented_at: at,
    })
  })
})

describe('unsubscribe page (GET)', () => {
  const page = read('app', '[locale]', 'newsletter', 'unsubscribe', 'page.tsx')
  it('performs no write and is noindex', () => {
    expect(page).not.toContain('.insert(')
    expect(page).not.toContain('.update(')
    expect(page).toMatch(/index:\s*false/)
  })
})

describe('unsubscribe button', () => {
  it('posts to the unsubscribe API', () => {
    const button = read('components', 'NewsletterUnsubscribeButton.tsx')
    expect(button).toContain('use client')
    expect(button).toContain('api/newsletter/unsubscribe')
  })
})

describe('unsubscribe route (POST)', () => {
  const route = read('app', 'api', 'newsletter', 'unsubscribe', 'route.ts')
  it('exports POST only', () => {
    expect(route).toMatch(/export async function POST/)
    expect(route).not.toMatch(/export async function (GET|PUT|PATCH|DELETE)/)
  })
  it('accepts form and JSON bodies and reads query params', () => {
    for (const s of ['application/x-www-form-urlencoded', 'application/json', 'searchParams']) {
      expect(route, s).toContain(s)
    }
  })
  it('verifies, records, then mirrors the unsubscribe in Resend', () => {
    for (const s of [
      "verifyNewsletterLink(secret, 'unsubscribe'",
      'resolveEmailState',
      'buildWithdrawalRow',
      'unsubscribe_link',
      "'unsubscribed'",
    ]) {
      expect(route, s).toContain(s)
    }
    expect(route.indexOf('.insert(')).toBeGreaterThan(-1)
    expect(route.indexOf('unsubscribeResendContact(')).toBeGreaterThan(route.indexOf('.insert('))
  })
})
