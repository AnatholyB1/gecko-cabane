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

// Removed by plan 02-04 once page.tsx is migrated.
const EXCLUDED_UNTIL_02_04 = [join('src', 'app', '[locale]', 'page.tsx')]

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
    ].filter((f) => !EXCLUDED_UNTIL_02_04.includes(relative(cwd, f)))

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
})
