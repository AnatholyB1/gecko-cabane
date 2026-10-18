/**
 * Navigation contract (06-08): guides menu, published-only language switcher,
 * footer guides and TripAdvisor .com link.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { guidesFor, switcherTargets, TRIPADVISOR_URL } from '../src/utils/seo'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('switcherTargets', () => {
  it('maps a FR slug to its EN counterpart', () => {
    expect(switcherTargets('/fr/restaurant-francais-krabi')).toEqual([
      { locale: 'fr', href: '/fr/restaurant-francais-krabi', current: true },
      { locale: 'en', href: '/en/french-restaurant-krabi', current: false },
      { locale: 'de', href: '/de/franzoesisches-restaurant-krabi', current: false },
    ])
  })
  it('omits unpublished locales', () => {
    expect(switcherTargets('/en/getting-here-from-ao-nang')).toHaveLength(1)
  })
  it('handles home and menu', () => {
    const home = switcherTargets('/fr')
    expect(home.find((t) => t.locale === 'fr')?.current).toBe(true)
    expect(home.find((t) => t.locale === 'en')?.href).toBe('/en')
    const menu = switcherTargets('/en/menu')
    expect(menu.find((t) => t.locale === 'fr')?.href).toBe('/fr/menu')
    expect(menu.find((t) => t.locale === 'en')?.current).toBe(true)
  })
  it('returns [] for unknown paths', () => {
    expect(switcherTargets('/fr/review')).toEqual([])
  })
})

describe('guidesFor / TRIPADVISOR_URL', () => {
  it('lists published guides in order', () => {
    expect(guidesFor('fr').map((g) => g.href)).toEqual([
      '/fr/restaurant-francais-krabi',
      '/fr/diner-romantique-krabi',
      '/fr/ou-manger-krabi-town',
    ])
    const en = guidesFor('en').map((g) => g.href)
    expect(en).toContain('/en/getting-here-from-ao-nang')
    expect(en[en.length - 1]).toBe('/en/wine-belgian-beer-krabi')
    expect(guidesFor('fr').map((g) => g.href)).not.toContain('/fr/wine-belgian-beer-krabi')
  })
  it('points to tripadvisor.com', () => {
    expect(TRIPADVISOR_URL.startsWith('https://www.tripadvisor.com/')).toBe(true)
  })
})

describe('components', () => {
  it('LanguageSwitcher is slug-aware', () => {
    const s = read('src/components/LanguageSwitcher.tsx')
    expect(s).toContain('switcherTargets(')
    expect(s).toContain('hrefLang')
    expect(s).not.toContain('(fr|en)')
    expect(s).not.toContain('availableLocales')
  })
  it('GuidesMenu is an accessible disclosure', () => {
    const s = read('src/components/GuidesMenu.tsx')
    expect(s.startsWith("'use client'")).toBe(true)
    expect(s).toContain('aria-expanded')
    expect(s).toContain('aria-controls')
    expect(s).toContain('Escape')
    expect(s).not.toContain('role="menu"')
  })
  it('header, footer and landing pages are wired', () => {
    expect(read('src/components/SiteHeader.tsx')).toContain('<GuidesMenu')
    expect(read('src/components/SiteHeader.tsx')).not.toContain('availableLocales')
    expect(read('src/components/SiteFooter.tsx')).toContain('guidesFor(')
    expect(read('src/components/seo/SeoLandingPage.tsx')).not.toContain('availableLocales')
    expect(read('src/app/[locale]/french-restaurant-krabi/page.tsx')).not.toContain('availableLocales')
  })
  it('home uses GuidesMenu, TRIPADVISOR_URL and no ARIA menubar', () => {
    const s = read('src/app/[locale]/page.tsx')
    expect(s).toContain('<GuidesMenu')
    expect(s).toContain('href={TRIPADVISOR_URL}')
    expect(s).toContain('guidesFor(')
    expect(s).not.toContain('role="menubar"')
    expect(s).not.toContain('role="menuitem"')
    expect(s).not.toContain('tripadvisor.be')
  })
})
