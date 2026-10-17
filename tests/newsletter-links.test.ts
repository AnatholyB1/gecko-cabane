import { describe, it, expect } from 'vitest'
import {
  signNewsletterLink,
  verifyNewsletterLink,
  parseLinkParams,
  buildConfirmUrl,
  buildUnsubscribeUrl,
  buildOneClickUnsubscribeUrl,
  guideUrl,
  recipeUrl,
  toPageLocale,
  CONFIRM_TTL_SECONDS,
} from '../src/utils/newsletter-links'

const SECRET = 'test-secret'
const NOW = 1_800_000_000

describe('newsletter link signing', () => {
  it('verifies a freshly signed link', () => {
    const exp = NOW + CONFIRM_TTL_SECONDS
    const sig = signNewsletterLink(SECRET, 'confirm', 42, exp)
    expect(verifyNewsletterLink(SECRET, 'confirm', 42, exp, sig, NOW)).toBe(true)
  })

  it('verifies a link without expiry', () => {
    const sig = signNewsletterLink(SECRET, 'unsubscribe', 7)
    expect(verifyNewsletterLink(SECRET, 'unsubscribe', 7, undefined, sig, NOW)).toBe(true)
  })

  it('rejects a tampered signature', () => {
    const exp = NOW + 100
    const sig = signNewsletterLink(SECRET, 'confirm', 42, exp)
    const bad = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1)
    expect(verifyNewsletterLink(SECRET, 'confirm', 42, exp, bad, NOW)).toBe(false)
  })

  it('rejects another row id', () => {
    const exp = NOW + 100
    const sig = signNewsletterLink(SECRET, 'confirm', 42, exp)
    expect(verifyNewsletterLink(SECRET, 'confirm', 43, exp, sig, NOW)).toBe(false)
  })

  it('rejects another purpose', () => {
    const exp = NOW + 100
    const sig = signNewsletterLink(SECRET, 'confirm', 42, exp)
    expect(verifyNewsletterLink(SECRET, 'unsubscribe', 42, exp, sig, NOW)).toBe(false)
  })

  it('rejects an expired link', () => {
    const exp = NOW - 1
    const sig = signNewsletterLink(SECRET, 'confirm', 42, exp)
    expect(verifyNewsletterLink(SECRET, 'confirm', 42, exp, sig, NOW)).toBe(false)
  })

  it('rejects a different-length signature without throwing', () => {
    expect(verifyNewsletterLink(SECRET, 'confirm', 42, NOW + 10, 'abc', NOW)).toBe(false)
  })
})

describe('newsletter URL builders', () => {
  it('buildConfirmUrl uses the page locale and a 30-day expiry', () => {
    const url = buildConfirmUrl(SECRET, 'de', 42, NOW)
    expect(url.startsWith('https://geckocabanerestaurant.com/en/newsletter/confirm?r=42&e=')).toBe(true)
    const u = new URL(url)
    expect(u.searchParams.get('e')).toBe(String(NOW + 2592000))
    expect(u.searchParams.get('s')).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('buildConfirmUrl keeps fr', () => {
    expect(buildConfirmUrl(SECRET, 'fr', 1, NOW)).toContain('/fr/newsletter/confirm?')
  })

  it('buildUnsubscribeUrl has no expiry', () => {
    const url = buildUnsubscribeUrl(SECRET, 'fr', 5)
    expect(url).toContain('/fr/newsletter/unsubscribe?r=5&s=')
    expect(new URL(url).searchParams.has('e')).toBe(false)
  })

  it('buildOneClickUnsubscribeUrl points to the API route', () => {
    const url = buildOneClickUnsubscribeUrl(SECRET, 5)
    expect(url.startsWith('https://geckocabanerestaurant.com/api/newsletter/unsubscribe?r=5&s=')).toBe(true)
  })

  it('guide and recipe URLs follow the PDF filename contract', () => {
    expect(guideUrl('fr')).toBe('https://geckocabanerestaurant.com/guide-gourmand-krabi-town-fr.pdf')
    expect(recipeUrl('en')).toBe('https://geckocabanerestaurant.com/recette-curry-crabe-en.pdf')
    expect(guideUrl('sv')).toBe('https://geckocabanerestaurant.com/guide-gourmand-krabi-town-en.pdf')
  })

  it('toPageLocale maps fr to fr and everything else to en', () => {
    expect(toPageLocale('fr')).toBe('fr')
    expect(toPageLocale('en')).toBe('en')
    expect(toPageLocale('de')).toBe('en')
    expect(toPageLocale('sv')).toBe('en')
    expect(toPageLocale('zz')).toBe('en')
  })
})

describe('parseLinkParams', () => {
  const s = 'A'.repeat(43)
  it('accepts valid params', () => {
    expect(parseLinkParams({ r: '12', e: '1800000000', s })).toEqual({ rowId: 12, exp: 1800000000, sig: s })
  })
  it('accepts a missing e', () => {
    expect(parseLinkParams({ r: '12', s })).toEqual({ rowId: 12, exp: undefined, sig: s })
  })
  it('rejects bad r', () => {
    expect(parseLinkParams({ r: '0', s })).toBeNull()
    expect(parseLinkParams({ r: 'abc', s })).toBeNull()
    expect(parseLinkParams({ r: '1.5', s })).toBeNull()
  })
  it('rejects bad s', () => {
    expect(parseLinkParams({ r: '1' })).toBeNull()
    expect(parseLinkParams({ r: '1', s: 'bad+chars/=' + 'A'.repeat(32) })).toBeNull()
  })
  it('rejects non-integer e', () => {
    expect(parseLinkParams({ r: '1', e: '12.5', s })).toBeNull()
    expect(parseLinkParams({ r: '1', e: 'x', s })).toBeNull()
  })
})
