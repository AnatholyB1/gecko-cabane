/**
 * Review page wiring tests (REV-01, D-10, D-11, D-12, D-18) - source scan + messages.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const pageSrc = read('src/app/[locale]/review/page.tsx')
const fr = JSON.parse(read('messages/fr.json'))
const en = JSON.parse(read('messages/en.json'))

const KEYS = ['back', 'google', 'intro', 'metaTitle', 'newTab', 'note', 'title', 'tripadvisor']

describe('review page', () => {
  it('is noindex and has no canonical/hreflang', () => {
    expect(pageSrc).toContain('robots: { index: false, follow: false }')
    expect(pageSrc).not.toContain('buildPageMetadata')
    expect(pageSrc).not.toContain('alternates')
    expect(pageSrc).not.toContain('canonical')
  })

  it('shows Google before TripAdvisor', () => {
    // Phase 5 D-08: buttons go through the counted redirect
    const g = pageSrc.indexOf('/api/review/go?t=google')
    const t = pageSrc.indexOf('/api/review/go?t=tripadvisor')
    expect(g).toBeGreaterThan(-1)
    expect(t).toBeGreaterThan(g)
    expect(pageSrc).not.toContain('googleReviewUrl(')
    expect(pageSrc).not.toContain('tripAdvisorReviewUrl(')
  })

  it('opens both links in a new tab safely', () => {
    expect(pageSrc.split('target="_blank"').length - 1).toBeGreaterThanOrEqual(2)
    expect(pageSrc.split('rel="noopener noreferrer"').length - 1).toBeGreaterThanOrEqual(2)
  })

  it('uses the review namespace', () => {
    expect(pageSrc).toMatch(/getTranslations\(\{[^}]*namespace: 'review'/)
  })

  it('is not a client component', () => {
    expect(pageSrc).not.toContain("'use client'")
  })

  it('is absent from the sitemap and published pages', () => {
    const seo = read('src/utils/seo.ts')
    const block = seo.slice(seo.indexOf('PUBLISHED_PAGES'), seo.indexOf('export const PUBLISHED_PATHS'))
    expect(block).not.toContain('/review')
    expect(read('src/app/sitemap.ts')).not.toContain('/review')
  })
})

describe('review messages', () => {
  it.each([
    ['fr', fr],
    ['en', en],
  ])('%s has exactly the expected keys', (_l, m) => {
    expect(Object.keys(m.review).sort()).toEqual(KEYS)
  })

  it.each([
    ['fr', fr],
    ['en', en],
  ])('%s has no incentive or rating wording', (_l, m) => {
    for (const v of Object.values(m.review) as string[]) {
      expect(v).not.toMatch(/\b(remise|offert|cadeau|gagner|discount|free|gift|win|reward)\b/i)
      expect(v).not.toMatch(/5 étoiles|5 stars/i)
    }
  })
})

describe('review aliases', () => {
  it.each([
    ['src/app/avis/route.ts', "handleReviewAlias(request, 'fr')"],
    ['src/app/bewertung/route.ts', "handleReviewAlias(request, 'de')"],
    ['src/app/review/route.ts', 'handleReviewAlias(request, null)'],
  ])('%s delegates to the shared handler', (file, call) => {
    const src = read(file)
    expect(src).toContain(call)
    expect(src).toContain('export async function GET')
    expect(src).toContain("dynamic = 'force-dynamic'")
  })

  it('shared handler uses 307 and the whitelisting helpers', () => {
    const src = read('src/utils/review-alias.ts')
    expect(src).toContain('307')
    expect(src).not.toContain('308')
    expect(src).not.toContain('permanent')
    expect(src).toContain('buildReviewRedirectPath(')
    expect(src).toContain('resolveReviewLocale(')
    expect(src).toContain('accept-language')
  })
})
