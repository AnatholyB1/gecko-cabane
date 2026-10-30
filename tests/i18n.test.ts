/**
 * i18n completeness tests
 *
 * Ensures fr.json and en.json are always in sync:
 *  - every key present in one file must be present in the other
 *  - no translation value may be an empty string
 *
 * Runs automatically during `npm run build` (before next build).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PAGES } from '../src/utils/seo'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all leaf dot-paths from a nested object. */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  )
}

/** Recursively find dot-paths whose value is an empty (or whitespace-only) string. */
function findEmptyValues(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'string') return obj.trim() === '' ? [prefix] : []
  if (typeof obj !== 'object' || obj === null) return []
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    findEmptyValues(value, prefix ? `${prefix}.${key}` : key)
  )
}

// ---------------------------------------------------------------------------
// Load message files
// ---------------------------------------------------------------------------

const root = join(process.cwd(), 'messages')

const fr: unknown = JSON.parse(readFileSync(join(root, 'fr.json'), 'utf-8'))
const en: unknown = JSON.parse(readFileSync(join(root, 'en.json'), 'utf-8'))

// D-07: pages whose contentLocales exclude 'fr' are EN-only; their namespace and
// meta keys are exempt from the fr<->en symmetry (nav.* stays symmetric).
const enOnlyNamespaces = PAGES.filter((p) => !p.contentLocales.includes('fr')).map((p) => p.namespace)
const isExempt = (k: string) =>
  enOnlyNamespaces.some((ns) => k.startsWith(`${ns}.`) || k.startsWith(`meta.${ns}`))

const de: unknown = JSON.parse(readFileSync(join(root, 'de.json'), 'utf-8'))
const sv: unknown = JSON.parse(readFileSync(join(root, 'sv.json'), 'utf-8'))

const frKeys = new Set(flattenKeys(fr).filter((k) => !isExempt(k)))
const enKeys = new Set(flattenKeys(en).filter((k) => !isExempt(k)))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('i18n — key symmetry', () => {
  it('every key in fr.json is present in en.json', () => {
    const missing = [...frKeys].filter((k) => !enKeys.has(k))
    expect(
      missing,
      missing.length
        ? `Keys present in fr.json but MISSING in en.json:\n${missing.map((k) => `  ✗ ${k}`).join('\n')}`
        : ''
    ).toHaveLength(0)
  })

  it('every key in en.json is present in fr.json', () => {
    const missing = [...enKeys].filter((k) => !frKeys.has(k))
    expect(
      missing,
      missing.length
        ? `Keys present in en.json but MISSING in fr.json:\n${missing.map((k) => `  ✗ ${k}`).join('\n')}`
        : ''
    ).toHaveLength(0)
  })
})

describe('i18n — value quality', () => {
  it('no translation value in fr.json is empty', () => {
    const empty = findEmptyValues(fr)
    expect(
      empty,
      empty.length
        ? `Empty values in fr.json:\n${empty.map((k) => `  ✗ ${k}`).join('\n')}`
        : ''
    ).toHaveLength(0)
  })

  it('no translation value in en.json is empty', () => {
    const empty = findEmptyValues(en)
    expect(
      empty,
      empty.length
        ? `Empty values in en.json:\n${empty.map((k) => `  ✗ ${k}`).join('\n')}`
        : ''
    ).toHaveLength(0)
  })
})

describe('i18n — de/sv fallback files', () => {
  it.each([
    ['de', de],
    ['sv', sv],
  ] as const)('every key of %s.json exists in en.json and no value is empty', (_name, file) => {
    const allEn = new Set(flattenKeys(en))
    const orphans = flattenKeys(file).filter((k) => k !== '' && !allEn.has(k))
    expect(orphans).toHaveLength(0)
    expect(findEmptyValues(file)).toHaveLength(0)
  })

  it('exposes de/sv endonyms in fr and en', () => {
    for (const f of [fr, en]) {
      const lang = (f as { language: Record<string, string> }).language
      expect(lang.de).toBe('Deutsch')
      expect(lang.sv).toBe('Svenska')
    }
  })
})

describe('i18n — de/sv completeness (no silent fallback)', () => {
  const required = [...new Set([...flattenKeys(fr), ...flattenKeys(en)])].filter((k) => k !== '')
  it.each([
    ['de', de],
    ['sv', sv],
  ] as const)('%s.json contains every key present in fr.json or en.json (all namespaces)', (name, file) => {
    const have = new Set(flattenKeys(file))
    const missing = required.filter((k) => !have.has(k))
    expect(
      missing,
      missing.length ? 'Keys MISSING in ' + name + '.json: ' + missing.join(', ') : ''
    ).toHaveLength(0)
  })
})
