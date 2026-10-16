/**
 * Hard-coded French literal guard (D-12, SEO-04)
 *
 * Scans the source of src/components/** and src/app/[locale]/** and fails when a
 * line contains an accented French character outside comments. Visible text must
 * go through next-intl (messages/*.json are NOT scanned).
 *
 * Opt-out convention: add `// i18n-ignore: reason` on the offending line or on
 * the line just before it (e.g. stored enum values sent to the API).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// Unaccented French phrases that the accent scan cannot catch (D-12, SEO-04).
const BANNED_PHRASES = [
  'Notre Histoire',
  'Notre Cuisine',
  'La Carte',
  'Nos Créations',
  'Nous trouver',
  'Horaires',
  'Chef de cuisine',
  'Accueil',
  "Fermer l'annonce",
  'La Table du Chef',
  "Souris d'agneau",
  'Enseigne du restaurant',
]

// Words legitimately kept in English messages (dish names, brand).
const ALLOWED_EN_WORDS = ['velouté', 'Gecko Cabane']

const ACCENTED = /[àâäçéèêëîïôöùûüœÀÂÉÈÊËÎÏÔÙÛÜÇŒ]/

const cwd = process.cwd()

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

/** Replace comments by blanks of the same line structure, keeping i18n-ignore markers. */
function stripComments(src: string): string[] {
  const lines = src.split('\n')
  const marks = lines.map((l) => l.includes('i18n-ignore'))
  const blank = (m: string) => m.replace(/[^\n]/g, '')
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (_m, p1: string) => p1)
    .split('\n')
  return stripped.map((l, i) => (marks[i] || marks[i - 1] ? '' : l))
}

describe('i18n — no hard-coded French literals', () => {
  it('src/components and src/app/[locale] contain no accented French literal', () => {
    const files = [
      ...walk(join(cwd, 'src', 'components')),
      ...walk(join(cwd, 'src', 'app', '[locale]')),
    ]

    const offenders: string[] = []
    for (const file of files) {
      stripComments(readFileSync(file, 'utf-8')).forEach((line, i) => {
        if (ACCENTED.test(line)) {
          offenders.push(`${relative(cwd, file)}:${i + 1}:${line.trim()}`)
        }
      })
    }
    expect(offenders, offenders.join('\n')).toHaveLength(0)
  })

  it('en.json menuSection, announcement and errors contain no French accents', () => {
    const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8'))
    const bad = JSON.stringify([en.menuSection, en.announcement, en.errors]).match(ACCENTED)
    expect(bad).toBeNull()
  })

  it('no banned unaccented French phrase in scanned sources', () => {
    const files = [
      ...walk(join(cwd, 'src', 'components')),
      ...walk(join(cwd, 'src', 'app', '[locale]')),
    ]
    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf-8')).join('\n')
      const hits = BANNED_PHRASES.filter((p) => code.includes(p))
      expect(hits, relative(cwd, file)).toEqual([])
    }
  })

  it('footer.openHours matches the real hours (12h-22h)', () => {
    const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8'))
    const fr = JSON.parse(readFileSync(join(cwd, 'messages', 'fr.json'), 'utf-8'))
    expect(en.footer.openHours, 'footer.openHours').not.toMatch(/11am|11pm/)
    expect(fr.footer.openHours, 'footer.openHours').not.toMatch(/11h|23h/)
  })

  it('en.json home namespaces contain no French accents', () => {
    const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8'))
    const keys = ['about', 'cuisine', 'menuSection', 'gallery', 'hoursSection', 'contactSection', 'hero', 'common', 'footer']
    for (const k of keys) {
      let json = JSON.stringify(en[k] ?? {})
      for (const w of ALLOWED_EN_WORDS) json = json.split(w).join('')
      expect(json.match(ACCENTED), k).toBeNull()
    }
  })
})
