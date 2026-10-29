/**
 * Source-scan contract test for the newsletter footer form (plan 07-03).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const fr = JSON.parse(read('messages/fr.json'))
const en = JSON.parse(read('messages/en.json'))

const KEYS: Record<string, string[]> = {
  'newsletter.form': ['emailLabel', 'consent', 'resident', 'submit', 'submitRecipe', 'submitting', 'successTitle', 'successBody', 'errorEmail', 'errorConsent', 'errorServer', 'errorRateLimit'],
  'newsletter.footer': ['title', 'pitch'],
  'newsletter.popup': ['title', 'body', 'close', 'regionLabel'],
  'newsletter.page': ['metaTitle', 'title', 'body', 'teaser'],
  'newsletter.confirm': ['metaTitle', 'title', 'button', 'confirming', 'success', 'already', 'recipeCta', 'guideCta', 'back', 'invalid', 'invalidCta', 'error'],
  'newsletter.unsubscribe': ['metaTitle', 'title', 'button', 'unsubscribing', 'intro', 'success', 'legal', 'resubscribe', 'invalid', 'error'],
  wifi: ['metaTitle', 'title', 'network', 'password', 'copy', 'copied', 'unavailableTitle', 'unavailableBody', 'optionalTitle', 'optionalBody'],
}

function ns(messages: Record<string, unknown>, path: string): Record<string, unknown> | undefined {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages) as Record<string, unknown> | undefined
}

describe('newsletter i18n contract', () => {
  for (const [path, keys] of Object.entries(KEYS)) {
    it(`${path} has all keys in fr and en`, () => {
      for (const m of [fr, en]) {
        const n = ns(m, path)
        expect(n).toBeDefined()
        for (const k of keys) expect(typeof n![k]).toBe('string')
      }
    })
  }

  it('consent text carries a privacy link tag in both locales', () => {
    expect(fr.newsletter.form.consent).toContain('<link>')
    expect(en.newsletter.form.consent).toContain('<link>')
  })
})

describe('NewsletterForm source', () => {
  const src = read('src/components/NewsletterForm.tsx')

  it('is a client component posting to the subscribe route', () => {
    expect(src.trimStart().startsWith("'use client'")).toBe(true)
    expect(src).toContain('api/newsletter/subscribe')
    expect(src).toContain('useLocale')
  })

  it('has accessible states and field attributes', () => {
    for (const needle of ['aria-describedby', 'role="status"', 'role="alert"', 'type="email"', 'autoComplete="email"', 'started_at', 'name="website"']) {
      expect(src).toContain(needle)
    }
  })

  it('consent is required and never pre-checked', () => {
    expect(src).toContain('required')
    expect(src).not.toMatch(/defaultChecked|checked=\{true\}/)
  })

  it('honeypot is hidden from tab order and assistive tech', () => {
    expect(src).toContain('tabIndex={-1}')
    expect(src).toContain('aria-hidden')
  })
})

describe('footer wiring', () => {
  it('SiteFooter and home page import the footer section', () => {
    expect(read('src/components/SiteFooter.tsx')).toContain('NewsletterFooterSection')
    expect(read('src/app/[locale]/page.tsx')).toContain('NewsletterFooterSection')
  })

  it('footer section uses source footer', () => {
    expect(read('src/components/NewsletterFooterSection.tsx')).toContain('source="footer"')
  })
})
