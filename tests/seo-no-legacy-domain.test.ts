/**
 * Guard: the legacy domain must not appear anywhere in code, messages,
 * public assets, README or tests (D-01, SEO-01).
 * The needle is built at runtime so this file never contains the literal.
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, extname, basename } from 'path'

const root = join(__dirname, '..')
const NEEDLE = ['gecko-cabane', 'com'].join('.')
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.json', '.txt', '.xml', '.svg', '.md', '.webmanifest'])

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe('legacy domain', () => {
  it('is absent from src, messages, public, README and tests', () => {
    const files = [
      ...walk(join(root, 'src')),
      ...walk(join(root, 'messages')),
      ...walk(join(root, 'public')),
      ...walk(join(root, 'tests')),
      join(root, 'README.md'),
    ].filter((f) => existsSync(f) && EXTENSIONS.has(extname(f)) && basename(f) !== 'seo-no-legacy-domain.test.ts')

    const hits: string[] = []
    for (const f of files) {
      readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (line.includes(NEEDLE)) hits.push(`${f.replace(root, '')}:${i + 1}`)
      })
    }
    expect(hits).toEqual([])
  })
})
