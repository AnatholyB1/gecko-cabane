/**
 * og:image and Twitter tags on every internal page (ONP-08), through generateMetadata.
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { buildPageMetadata, buildShareMetadata, ogImage, LOCALES } from '../src/utils/seo'

const root = join(__dirname, '..')
const pagesDir = join(root, 'src/app/[locale]')

function pageFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) pageFiles(full, out)
    // not-found-fallback is the noindex 404 body (middleware rewrite target), not an internal page to share
    else if (name === 'page.tsx' && !full.includes('not-found-fallback')) out.push(full)
  }
  return out
}

describe('share metadata helpers', () => {
  for (const locale of LOCALES) {
    it(`[${locale}] buildPageMetadata carries og:image and the four twitter fields`, () => {
      const md = buildPageMetadata({ locale, path: '/menu', title: 'Titre', description: 'Description' })
      const img = ogImage(locale)
      expect(img.url).toBe(`https://geckocabanerestaurant.com/${locale}/opengraph-image`)
      expect(img.width).toBe(1200)
      expect(img.height).toBe(630)
      expect(md.openGraph?.images).toEqual([img])
      expect(md.twitter).toMatchObject({
        card: 'summary_large_image',
        title: 'Titre',
        description: 'Description',
        images: [img.url],
      })
    })

    it(`[${locale}] buildShareMetadata (noindex pages) has image and twitter card, no url`, () => {
      const md = buildShareMetadata({ locale, title: 'Titre' })
      expect(md.openGraph).toMatchObject({ title: 'Titre', images: [ogImage(locale)] })
      expect(md.openGraph).not.toHaveProperty('url')
      expect(md.twitter).toMatchObject({ card: 'summary_large_image', title: 'Titre', images: [ogImage(locale).url] })
    })
  }
})

describe('every internal page builds its metadata with a share-aware helper', () => {
  const files = pageFiles(pagesDir)
  it('finds the internal pages', () => {
    expect(files.length).toBeGreaterThanOrEqual(11)
  })
  for (const file of files) {
    const rel = file.slice(root.length + 1).replace(/\\/g, '/')
    it(`${rel}`, () => {
      const src = readFileSync(file, 'utf8')
      expect(src).toContain('generateMetadata')
      expect(src).toMatch(/localizedPageMetadata\(|buildPageMetadata\(|buildShareMetadata\(/)
    })
  }
})
