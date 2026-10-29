/**
 * Newsletter entry points: /newsletter (bill QR) and /wifi (table card) aliases and pages (NEWS-03, NEWS-04, D-12, D-13)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

describe('newsletter aliases', () => {
  it('builds the newsletter alias path with the whitelisted src only', async () => {
    const { buildNewsletterAliasPath } = await import('../src/utils/newsletter-alias')
    expect(buildNewsletterAliasPath('newsletter', 'en', { src: 'qr' })).toBe('/en/newsletter?src=qr')
    expect(buildNewsletterAliasPath('newsletter', 'fr', { src: 'evil' })).toBe('/fr/newsletter')
    expect(buildNewsletterAliasPath('newsletter', 'fr', { src: null })).toBe('/fr/newsletter')
  })

  it('builds the wifi alias path with the whitelisted src only', async () => {
    const { buildNewsletterAliasPath } = await import('../src/utils/newsletter-alias')
    expect(buildNewsletterAliasPath('wifi', 'en', { src: 'wifi' })).toBe('/en/wifi?src=wifi')
    expect(buildNewsletterAliasPath('wifi', 'fr', { src: 'qr' })).toBe('/fr/wifi')
  })

  it('serves /wifi with Cache-Control private, no-store', () => {
    const cfg = read('next.config.ts')
    expect(cfg).toMatch(/headers\s*\(/)
    expect(cfg).toContain('no-store')
    expect(cfg).toContain('wifi')
  })
})

describe('newsletter pages', () => {
  const nl = () => read('src/app/[locale]/newsletter/page.tsx')
  const wifi = () => read('src/app/[locale]/wifi/page.tsx')

  it.each([
    ['newsletter', () => nl()],
    ['wifi', () => wifi()],
  ])('%s page is noindex with no canonical or hreflang', (_n, get) => {
    const src = get()
    expect(src).toContain('generateMetadata')
    expect(src).toMatch(/index:\s*false/)
    expect(src).not.toContain('alternates')
    expect(src).not.toContain('canonical')
  })

  it('pages are absent from PUBLISHED_PAGES', async () => {
    const { PUBLISHED_PAGES } = await import('../src/utils/seo')
    const paths = PUBLISHED_PAGES.map((p) => p.path)
    expect(paths).not.toContain('/newsletter')
    expect(paths).not.toContain('/wifi')
  })

  it('newsletter page maps src=qr to bill_qr', () => {
    const src = nl()
    expect(src).toContain('bill_qr')
    expect(src).toContain('newsletter_page')
  })

  it('wifi page reads credentials server-side at request time', () => {
    const src = wifi()
    expect(src).toContain('force-dynamic')
    expect(src).toContain('process.env.WIFI_PASSWORD')
    expect(src).toContain('process.env.WIFI_SSID')
    expect(src).toContain('source="wifi"')
    expect(src).not.toContain('NEXT_PUBLIC_WIFI')
  })

  it('WifiCopyButton is a client component using the clipboard and a live region', () => {
    const src = read('src/components/WifiCopyButton.tsx')
    expect(src.trimStart().startsWith("'use client'")).toBe(true)
    expect(src).toContain('navigator.clipboard')
    expect(src).toContain('aria-live')
  })

  it('review page uses the shared button classes', () => {
    expect(read('src/app/[locale]/review/page.tsx')).toContain("from '@/components/ui/buttonClasses'")
  })
})
