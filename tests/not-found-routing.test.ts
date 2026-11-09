import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { unknownLocalePathLocale, EXTRA_LOCALE_PATHS } from '../src/utils/middleware-routing'
import { PAGES } from '../src/utils/seo'

describe('unknownLocalePathLocale (translated 404 rewrite)', () => {
  it('flags unknown paths under a valid locale', () => {
    expect(unknownLocalePathLocale('/en/nope')).toBe('en')
    expect(unknownLocalePathLocale('/de/nope/deeper')).toBe('de')
    expect(unknownLocalePathLocale('/sv/menu/x')).toBe('sv')
  })

  it('lets known pages, translated slugs and trailing slashes through', () => {
    expect(unknownLocalePathLocale('/fr')).toBeNull()
    expect(unknownLocalePathLocale('/fr/')).toBeNull()
    expect(unknownLocalePathLocale('/en/menu')).toBeNull()
    expect(unknownLocalePathLocale('/de/franzoesisches-restaurant-krabi')).toBeNull()
    expect(unknownLocalePathLocale('/fr/newsletter/confirm')).toBeNull()
    expect(unknownLocalePathLocale('/en/opengraph-image')).toBeNull()
  })

  it('ignores non-locale first segments (default 404 / intl redirect handle them)', () => {
    expect(unknownLocalePathLocale('/foo')).toBeNull()
    expect(unknownLocalePathLocale('/apple-touch-icon-precomposed.png')).toBeNull()
    expect(unknownLocalePathLocale('/frx/menu')).toBeNull()
  })

  it('knows every route folder of src/app/[locale] (a new page must be registered, or it would 404)', () => {
    const root = join(__dirname, '..', 'src', 'app', '[locale]')
    const folders: string[] = []
    const walk = (dir: string, rel: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue
        const next = `${rel}/${e.name}`
        if (existsSync(join(dir, e.name, 'page.tsx'))) folders.push(next)
        walk(join(dir, e.name), next)
      }
    }
    walk(root, '')
    const known = new Set<string>([...PAGES.map((p) => p.key), ...EXTRA_LOCALE_PATHS])
    const unregistered = folders.filter((f) => f !== '/not-found-fallback' && !known.has(f))
    expect(unregistered).toEqual([])
    // opengraph-image is a file convention (no page.tsx)
    expect(existsSync(join(root, 'opengraph-image.tsx'))).toBe(true)
  })
})
