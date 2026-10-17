/**
 * Source-scan of the Restaurant JSON-LD wiring (plan 02-06).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

describe('opening-hours cache', () => {
  const src = read('src/utils/opening-hours.ts')
  it('uses unstable_cache with tag and 1h revalidate, cookie-free anon client', () => {
    expect(src).toContain('unstable_cache')
    expect(src).toContain("OPENING_HOURS_TAG = 'opening-hours'")
    expect(src).toContain('revalidate: 3600')
    expect(src).toContain('persistSession: false')
  })
  it('never uses cookies-bound or service-role clients', () => {
    expect(src).not.toContain('utils/supabase/server')
    expect(src).not.toContain('SERVICE_ROLE')
    expect(src).not.toContain('createAdminClient')
  })
})

describe('hours route invalidation', () => {
  const src = read('src/app/api/hours/route.ts')
  const call = "revalidateTag(OPENING_HOURS_TAG, 'max')"
  it('calls revalidateTag once, after the update loop and before success', () => {
    expect(src.split(call).length - 1).toBe(1)
    const idx = src.indexOf(call)
    expect(idx).toBeGreaterThan(src.indexOf('for (const hour of hours)'))
    expect(idx).toBeLessThan(src.indexOf('success: true'))
  })
})

describe('RestaurantJsonLd component', () => {
  const src = read('src/components/RestaurantJsonLd.tsx')
  it('renders escaped JSON-LD from cached hours', () => {
    for (const s of [
      'application/ld+json',
      'serializeJsonLd(',
      'buildRestaurantJsonLd(',
      'getOpeningHours()',
      'captureException',
      "namespace: 'meta'",
    ]) {
      expect(src).toContain(s)
    }
  })
  it('is rendered by the home page', () => {
    expect(read('src/app/[locale]/page.tsx')).toContain('<RestaurantJsonLd')
  })
  it('is the only JSON-LD emitter under src', () => {
    const hits = walk(join(root, 'src')).filter((f) =>
      readFileSync(f, 'utf8').includes('application/ld+json'),
    )
    expect(hits.map((f) => f.replace(/\\/g, '/').split('/src/')[1])).toEqual([
      'components/RestaurantJsonLd.tsx',
    ])
  })
})

describe('OG image per locale', () => {
  it('moved under [locale] and reads params', () => {
    expect(existsSync(join(root, 'src/app/opengraph-image.tsx'))).toBe(false)
    const p = join(root, 'src/app/[locale]/opengraph-image.tsx')
    expect(existsSync(p)).toBe(true)
    expect(readFileSync(p, 'utf8')).toContain('params')
  })
})

describe('SAME_AS (D-09)', () => {
  it('are https, on the host allow-list and recorded as approved in 02-LAUNCH.md', async () => {
    const { SAME_AS } = await import('../src/utils/seo')
    const launch = read('.planning/phases/02-fondations-seo-techniques/02-LAUNCH.md')
    const allowed = [
      /^https:\/\/www\.google\.com\/maps\//,
      /^https:\/\/www\.tripadvisor\.com\//,
      /^https:\/\/www\.facebook\.com\//,
      /^https:\/\/www\.instagram\.com\//,
    ]
    for (const url of SAME_AS) {
      expect(allowed.some((re) => re.test(url))).toBe(true)
      expect(launch).toContain(url)
    }
    expect(launch).toContain('Owner approvals / Task 2 outcome')
  })
  it('never emits aggregateRating; hasMenu points to /menu', () => {
    const src = read('src/utils/seo.ts')
    expect(src).not.toMatch(/aggregateRating\s*:/)
    expect(src).toContain("hasMenu: localeUrl(locale, '/menu')")
  })
})
