/**
 * Review-document tests (Phase 6, I18N-01, D-06/D-08/D-09).
 * Parametrised over LOCS so a later plan adds 'sv'.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const LOCS = ['de'] as const

type Scope = { files: Record<string, { pageKey: string | null; prefixes: string[] }> }
const scope: Scope = JSON.parse(readFileSync(join(root, 'scripts/translation-scope.json'), 'utf-8'))

function leaves(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, prefix ? `${prefix}.${k}` : k)
  )
}
function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj)
}
function scopedKeys(file: string, messages: unknown): string[] {
  const { prefixes } = scope.files[file]
  return leaves(messages).filter((k) => k !== '' && prefixes.some((p) => k === p || k.startsWith(`${p}.`)))
}

const en = JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf-8'))
const SIGN = /^- \[( |x)\] Validé par écrit par :/m

describe.each(LOCS)('review set for %s', (loc) => {
  const messages = JSON.parse(readFileSync(join(root, `messages/${loc}.json`), 'utf-8'))

  it('complete draft: every scoped en key has a non-empty value', () => {
    const missing: string[] = []
    for (const file of Object.keys(scope.files)) {
      for (const k of scopedKeys(file, en)) {
        const v = get(messages, k)
        if (typeof v !== 'string' || v.trim() === '') missing.push(k)
      }
    }
    expect(missing).toEqual([])
  })

  for (const file of Object.keys(scope.files)) {
    it(`review doc ${file}.md has table, one row per key and sign-off`, () => {
      const p = join(root, 'docs/ph6/review', loc, `${file}.md`)
      expect(existsSync(p)).toBe(true)
      const doc = readFileSync(p, 'utf-8')
      expect(doc).toContain(`| Clé | FR | ${loc.toUpperCase()} | Corrections du relecteur |`)
      const rows = doc.split('\n').filter((l) => l.startsWith('| `'))
      expect(rows.length).toBe(scopedKeys(file, en).length)
      expect(doc).toMatch(SIGN)
    })
  }

  for (const extra of ['emails.md', 'qr-print.md']) {
    it(`${extra} exists with a sign-off line`, () => {
      const p = join(root, 'docs/ph6/review', loc, extra)
      expect(existsSync(p)).toBe(true)
      expect(readFileSync(p, 'utf-8')).toMatch(SIGN)
    })
  }

  it('qr-print.md carries the DE QR title', () => {
    const doc = readFileSync(join(root, 'docs/ph6/review', loc, 'qr-print.md'), 'utf-8')
    expect(doc).toContain('Eine Bewertung hilft uns sehr')
  })
})

describe('D-08: dish names and descriptions stay French', () => {
  it('no name_de / description_de in migrations or menu code', () => {
    const dir = join(root, 'supabase/migrations')
    for (const f of readdirSync(dir)) {
      const sql = readFileSync(join(dir, f), 'utf-8')
      expect(sql, f).not.toContain('name_de')
      expect(sql, f).not.toContain('description_de')
    }
    for (const f of ['src/utils/menu.ts', 'src/components/MenuSections.tsx']) {
      const p = join(root, f)
      if (existsSync(p)) expect(readFileSync(p, 'utf-8')).not.toContain('name_de')
    }
  })
})
