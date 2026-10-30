/**
 * Static wiring checks for plan 08-07: /admin/kpi page (French fixed, admin only,
 * no public exposure) and the admin home links.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf-8')
const count = (src: string, needle: string) => src.split(needle).length - 1

const PAGE = 'src/app/admin/kpi/page.tsx'

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

describe('/admin/kpi page', () => {
  it('exists', () => {
    expect(existsSync(join(root, PAGE))).toBe(true)
  })

  it('is a French-fixed client page fetching /api/kpi', () => {
    const src = read(PAGE)
    expect(src.trimStart().startsWith("'use client'")).toBe(true)
    expect(src).toContain("fetch('/api/kpi")
    expect(src).toContain("from '@/utils/kpi-format'")
    expect(src).not.toMatch(/next-intl|useTranslations/)
  })

  it('imports no server-only module and no unsafe rendering', () => {
    const src = read(PAGE)
    expect(src).not.toContain('@/utils/resend')
    expect(src).not.toContain('@/utils/supabase/server')
    expect(src).not.toContain('dangerouslySetInnerHTML')
    expect(src).not.toMatch(/bg-\[var|border-\[var|text-\[var/)
    expect(src.toLowerCase()).not.toContain('n8n')
  })

  it('shows the required labels', () => {
    const src = read(PAGE)
    expect(src).toContain('Rapports TEST envoyés')
    expect(src).toContain('Sources non disponibles')
    expect(src).toMatch(/UNAVAILABLE_LABEL|formatKpiValue/)
    expect(src).toContain('KPI hebdomadaires')
  })
})

describe('admin home', () => {
  it('links /admin/kpi from the card and the quick actions', () => {
    expect(count(read('src/app/admin/page.tsx'), 'href="/admin/kpi"')).toBe(2)
  })
})

describe('no public exposure', () => {
  it('no public page links to /admin/kpi or /api/kpi', () => {
    const offenders = walk(join(root, 'src/app/[locale]'))
      .concat(walk(join(root, 'src/components')))
      .filter((f) => /\.(tsx?|jsx?)$/.test(f))
      .filter((f) => /\/(admin\/kpi|api\/kpi)/.test(readFileSync(f, 'utf-8')))
    expect(offenders).toEqual([])
  })
})
