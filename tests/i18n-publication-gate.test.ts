/**
 * Publication gate for de/sv (D-06, D-07): a page can be listed for de/sv in
 * PUBLISHED_PAGES only with a dated written validation and complete message keys.
 * Runs during `npm run build` (vitest gates next build).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PUBLISHED_PAGES } from '../src/utils/seo'
import { REVIEW_LOCALES } from '../src/utils/review-links'
import { EMAIL_LOCALES } from '../src/utils/email-locales'

type Scope = { files: Record<string, { pageKey: string | null; prefixes: string[] }> }

const root = process.cwd()
const scope: Scope = JSON.parse(readFileSync(join(root, 'scripts/translation-scope.json'), 'utf-8'))
const load = (loc: string): unknown => JSON.parse(readFileSync(join(root, 'messages', `${loc}.json`), 'utf-8'))

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k)
  )
}

const matches = (key: string, prefix: string) => key === prefix || key.startsWith(`${prefix}.`)
const enKeys = flatten(load('en'))

const SIGNED = /^- \[x\] Validé par écrit par : .+Date : \d{4}-\d{2}-\d{2}/m

describe('translation-scope.json', () => {
  it('has every expected file entry', () => {
    for (const f of ['ui', 'home', 'menu', 'review']) expect(scope.files).toHaveProperty(f)
  })

  it('every prefix matches at least one key of en.json', () => {
    for (const [file, def] of Object.entries(scope.files)) {
      for (const p of def.prefixes) {
        expect(
          enKeys.some((k) => matches(k, p)),
          `${file}: prefix "${p}" matches no key in en.json`
        ).toBe(true)
      }
    }
  })
})

describe('de/sv publication gate', () => {
  it('currently publishes no sv page', () => {
    for (const p of PUBLISHED_PAGES) {
      expect(p.locales as readonly string[]).not.toContain('sv')
    }
  })

  it('REVIEW_LOCALES lists de only with a signed review.md (and never sv)', () => {
    expect(REVIEW_LOCALES as readonly string[]).not.toContain('sv')
    if ((REVIEW_LOCALES as readonly string[]).includes('de')) {
      const doc = join(root, 'docs/ph6/review/de/review.md')
      expect(readFileSync(doc, 'utf-8'), `${doc} not signed`).toMatch(SIGNED)
    }
  })

  it('EMAIL_LOCALES lists de only with a signed emails.md (and never sv)', () => {
    expect(EMAIL_LOCALES as readonly string[]).not.toContain('sv')
    if ((EMAIL_LOCALES as readonly string[]).includes('de')) {
      const doc = join(root, 'docs/ph6/review/de/emails.md')
      expect(readFileSync(doc, 'utf-8'), `${doc} not signed`).toMatch(SIGNED)
    }
  })

  for (const loc of ['de', 'sv'] as const) {
    for (const page of PUBLISHED_PAGES) {
      if (!(page.locales as readonly string[]).includes(loc)) continue
      it(`${loc} ${page.path || '/'} has a signed review and complete keys`, () => {
        const files = Object.entries(scope.files).filter(
          ([name, def]) => name === 'ui' || def.pageKey === page.path
        )
        const keys = new Set(flatten(load(loc)))
        for (const [name, def] of files) {
          const doc = join(root, 'docs/ph6/review', loc, `${name}.md`)
          expect(existsSync(doc), `missing review file ${doc}`).toBe(true)
          expect(readFileSync(doc, 'utf-8'), `${doc} not signed`).toMatch(SIGNED)
          const needed = enKeys.filter((k) => def.prefixes.some((p) => matches(k, p)))
          const missing = needed.filter((k) => !keys.has(k))
          expect(missing, `${loc}.json lacks keys for ${name}: ${missing.slice(0, 5).join(', ')}`).toHaveLength(0)
        }
      })
    }
  }
})
