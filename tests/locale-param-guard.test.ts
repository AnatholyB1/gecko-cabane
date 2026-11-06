/**
 * Sentry GECKO-CABANE-S: GET /apple-touch-icon-precomposed.png matched [locale] and
 * new Intl.NumberFormat received an invalid locale. Unknown params must 404 before render.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { toSeoLocale } from '../src/utils/seo'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('[locale] param guard', () => {
  it('layout rejects unknown locale params before render', () => {
    const layout = read('src/app/[locale]/layout.tsx')
    expect(layout).toContain('export const dynamicParams = false')
    expect(layout).toMatch(/generateStaticParams[\s\S]*locales\.map/)
  })

  it('no nested dynamic segment under [locale]', () => {
    const dirs = readdirSync(join(root, 'src/app/[locale]'), { withFileTypes: true, recursive: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
    expect(dirs.filter((d) => d.startsWith('['))).toEqual([])
  })

  it('SocialProof receives a validated locale', () => {
    const page = read('src/app/[locale]/page.tsx')
    expect(page).toContain('<SocialProof locale={toSeoLocale(locale)} />')
    expect(page).not.toContain('<SocialProof locale={locale as SeoLocale}')
  })

  it('serves the precomposed icon iOS probes', () => {
    expect(existsSync(join(root, 'public/apple-touch-icon-precomposed.png'))).toBe(true)
  })

  it('toSeoLocale yields a locale Intl accepts for the crash input', () => {
    expect(() => new Intl.NumberFormat(toSeoLocale('apple-touch-icon-precomposed.png'))).not.toThrow()
  })
})
