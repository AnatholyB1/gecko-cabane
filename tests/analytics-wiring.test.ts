/** Analytics wiring tests (KPI-01, RESA-06, D-01..D-05) - source scan. */

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

describe('PlausibleScript', () => {
  const src = read('src/components/PlausibleScript.tsx')
  it('is a server component using next/script', () => {
    expect(src).not.toMatch(/['"]use client['"]/)
    expect(src).toContain("from 'next/script'")
  })
  it('is inert without an id and proxies through /gcm', () => {
    expect(src).toContain('getPlausibleScriptId()')
    expect(src).toContain('return null')
    expect(src).toContain('/gcm/js/script.js')
    expect(src).toContain('/gcm/api/event')
    expect(src).toContain('strategy="afterInteractive"')
  })
})

describe('next.config rewrites', () => {
  const src = read('next.config.ts')
  it('proxies script and events, keyed on a validated id', () => {
    for (const s of [
      'async rewrites()',
      '/gcm/js/script.js',
      '/gcm/api/event',
      'https://plausible.io/js/',
      'https://plausible.io/api/event',
      'NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID',
      'pa-[A-Za-z0-9_-]+',
    ]) {
      expect(src).toContain(s)
    }
  })
})

describe('layout', () => {
  it('renders PlausibleScript and AttributionCapture', () => {
    const src = read('src/app/[locale]/layout.tsx')
    expect(src).toContain('<PlausibleScript')
    expect(src).toContain('<AttributionCapture')
  })
})

describe('ReservationForm', () => {
  const src = read('src/components/ReservationForm.tsx')
  it('sends attribution and tracks after success', () => {
    expect(src).toContain('readAttribution()')
    const ok = src.indexOf('if (response.ok)')
    const tr = src.indexOf('track(EVENTS.reservationSent')
    expect(ok).toBeGreaterThan(-1)
    expect(tr).toBeGreaterThan(ok)
  })
})

describe('global rules', () => {
  const files = walk(join(root, 'src'))
  it('only analytics.ts and PlausibleScript reference window.plausible', () => {
    const offenders = files
      .filter((f) => readFileSync(f, 'utf8').includes('window.plausible'))
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => !f.endsWith('src/utils/analytics.ts') && !f.endsWith('src/components/PlausibleScript.tsx'))
    expect(offenders).toEqual([])
  })
  it('uses no next-plausible or gtag (D-01)', () => {
    const offenders = files.filter((f) => {
      const s = readFileSync(f, 'utf8')
      return s.includes('next-plausible') || s.includes('gtag(')
    })
    expect(offenders).toEqual([])
  })
})
