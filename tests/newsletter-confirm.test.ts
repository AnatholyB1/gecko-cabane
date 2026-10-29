import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { newsletterWelcomeEmail } from '../src/utils/newsletter-emails'

const root = join(__dirname, '..', 'src')
const route = readFileSync(join(root, 'app', 'api', 'newsletter', 'confirm', 'route.ts'), 'utf-8')
const page = readFileSync(
  join(root, 'app', '[locale]', 'newsletter', 'confirm', 'page.tsx'),
  'utf-8'
)
const button = readFileSync(join(root, 'components', 'NewsletterConfirmButton.tsx'), 'utf-8')

describe('confirm page (GET)', () => {
  it('performs no write', () => {
    expect(page).not.toContain('createAdminClient')
    expect(page).not.toContain('.update(')
    expect(page).not.toContain('.insert(')
  })
  it('is noindex', () => {
    expect(page).toContain('generateMetadata')
    expect(page).toMatch(/index:\s*false/)
  })
})

describe('confirm button', () => {
  it('posts to the confirm API', () => {
    expect(button).toContain('use client')
    expect(button).toContain('api/newsletter/confirm')
  })
})

describe('confirm route (POST)', () => {
  it('exports POST only', () => {
    expect(route).toMatch(/export async function POST/)
    expect(route).not.toMatch(/export async function (GET|PUT|PATCH|DELETE)/)
  })
  it('verifies, guards and updates conditionally', () => {
    for (const s of ['verifyNewsletterLink', 'canConfirmRow', ".is('confirmed_at', null)"]) {
      expect(route, s).toContain(s)
    }
  })
  it('mirrors the Resend contact only after the confirmed_at update', () => {
    const upd = route.indexOf("confirmed_at: ")
    const brevo = route.indexOf('upsertResendContact(')
    expect(upd).toBeGreaterThan(-1)
    expect(brevo).toBeGreaterThan(upd)
  })
  it('counts confirmations and sends the welcome email', () => {
    expect(route).toContain("'confirmed'")
    expect(route).toContain('newsletterWelcomeEmail(')
  })
})

describe('newsletterWelcomeEmail', () => {
  const guide = 'https://example.test/guide.pdf'
  const recipe = 'https://example.test/recipe.pdf'
  const unsubscribe = 'https://example.test/unsub'
  it('contains the guide and no recipe when recipe is null', () => {
    const m = newsletterWelcomeEmail('fr', { guide, recipe: null, unsubscribe })
    expect(m.html).toContain(guide)
    expect(m.html).not.toContain(recipe)
    expect(m.text).toContain(guide)
  })
  it('contains the recipe when set', () => {
    const m = newsletterWelcomeEmail('fr', { guide, recipe, unsubscribe })
    expect(m.html).toContain(recipe)
  })
  it('EN mentions GDPR', () => {
    const m = newsletterWelcomeEmail('en', { guide, recipe: null, unsubscribe })
    expect(m.html).toContain('GDPR')
    expect(m.subject).toBe('Welcome to Gecko Cabane')
  })
  it('escapes injected HTML', () => {
    const m = newsletterWelcomeEmail('en', {
      guide: 'https://x.test/"><script>alert(1)</script>',
      recipe: null,
      unsubscribe,
    })
    expect(m.html).not.toContain('<script>')
  })
})
