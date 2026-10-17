import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { newsletterConfirmEmail } from '../src/utils/resend'

const route = readFileSync(
  join(__dirname, '..', 'src', 'app', 'api', 'newsletter', 'subscribe', 'route.ts'),
  'utf-8'
)

describe('subscribe route wiring', () => {
  it('exports POST only', () => {
    expect(route).toMatch(/export async function POST/)
    expect(route).not.toMatch(/export async function (GET|PUT|PATCH|DELETE)/)
  })
  it('uses the admin client with a justifying comment', () => {
    const i = route.indexOf('createAdminClient()')
    expect(i).toBeGreaterThan(-1)
    expect(route.slice(Math.max(0, i - 400), i)).toMatch(/service role|RLS/i)
  })
  it('calls the guards and helpers', () => {
    for (const s of [
      'isHoneypotFilled',
      'checkFillTime',
      'checkNewsletterRateLimits',
      'decideSubscribeAction',
      'newsletterConfirmEmail(',
      'gecko_newsletter_count',
      'sanitizeGeoCountry',
      'x-vercel-ip-country',
    ]) {
      expect(route, s).toContain(s)
    }
  })
  it('never stores the IP and never touches Brevo', () => {
    expect(route).not.toMatch(/\bip\s*:/)
    expect(route).not.toMatch(/brevo/i)
  })
  it('sets one-click unsubscribe headers', () => {
    expect(route).toContain('List-Unsubscribe')
    expect(route).toContain('List-Unsubscribe-Post')
  })
})

describe('newsletterConfirmEmail', () => {
  const urls = {
    confirm: 'https://geckocabanerestaurant.com/fr/newsletter/confirm?r=1&e=2&s=abc',
    unsubscribe: 'https://geckocabanerestaurant.com/fr/newsletter/unsubscribe?r=1&s=abc',
  }
  it('fr variant', () => {
    const m = newsletterConfirmEmail('fr', urls)
    expect(m.html).toContain(urls.confirm.replace(/&/g, '&amp;'))
    expect(m.html).toContain(urls.unsubscribe.replace(/&/g, '&amp;'))
    expect(m.html).toContain('PDPA B.E. 2562')
    expect(m.html).toContain('30 jours')
    expect(m.text.length).toBeGreaterThan(0)
    expect(m.text).toContain(urls.confirm)
  })
  it('en variant', () => {
    const m = newsletterConfirmEmail('en', urls)
    expect(m.html).toContain('GDPR')
    expect(m.html).toContain('30 days')
  })
  it('escapes injected markup', () => {
    const m = newsletterConfirmEmail('en', {
      confirm: 'https://x.test/?a="><script>alert(1)</script>',
      unsubscribe: 'https://x.test/?b="><script>',
    })
    expect(m.html).not.toContain('<script>')
  })
})
