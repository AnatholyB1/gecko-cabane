/**
 * Review click tracking wiring tests (REV-01, REV-03, D-13, D-14) - source scan.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

describe('review-tracking helper', () => {
  const src = read('src/utils/review-tracking.ts')

  it('uses the service role with a justification and token-keyed queries', () => {
    expect(src).toContain('createAdminClient()')
    expect(src).toContain(".eq('review_token'")
    expect(src).toContain(".is('review_clicked_at', null)")
    expect(src).toContain("select('locale')")
    expect(src.toLowerCase()).toContain('service role')
  })

  it('never throws (try/catch)', () => {
    expect(src).toContain('catch')
  })

  it("is not imported from any 'use client' file", () => {
    const offenders = walk(join(root, 'src')).filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /^\s*['"]use client['"]/.test(s) && s.includes('review-tracking')
    })
    expect(offenders).toEqual([])
  })
})

describe('review-stats helper', () => {
  const src = read('src/utils/review-stats.ts')
  it('writes through the service-role RPC and never throws', () => {
    expect(src).toContain('createAdminClient()')
    expect(src).toContain("rpc('gecko_review_click_hit'")
    expect(src).toContain('catch')
    expect(src.toLowerCase()).toContain('service role')
  })
  it("is not imported from any 'use client' file", () => {
    const offenders = walk(join(root, 'src')).filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /^\s*['"]use client['"]/.test(s) && s.includes('review-stats')
    })
    expect(offenders).toEqual([])
  })
})

describe('review alias', () => {
  const src = read('src/utils/review-alias.ts')
  it('looks up the rid locale when the token is valid', () => {
    expect(src).toContain('lookupReviewLocale(')
    expect(src).toContain('isReviewToken(')
    expect(src).not.toContain('ridLocale: null')
  })
})

describe('review page', () => {
  const src = read('src/app/[locale]/review/page.tsx')
  it('marks the click for a valid rid and stays noindex', () => {
    expect(src).toContain('await searchParams')
    expect(src).toContain('isReviewToken(')
    expect(src).toContain('markReviewClicked(')
    expect(src).toContain('robots: { index: false, follow: false }')
  })
  it('counts the visit per source after the response', () => {
    expect(src).toContain('after(')
    expect(src).toContain("recordReviewHitThrottled(source, 'visit'")
    expect(src).toContain('resolveVerifiedSource(')
  })
  it('renders no guest data', () => {
    expect(src).not.toContain('customer_name')
    expect(src).not.toContain('customer_email')
    expect(src).not.toContain('review_token')
  })
})
