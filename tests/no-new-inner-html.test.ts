/**
 * Guard rail: dangerouslySetInnerHTML is an XSS sink. Only the JSON-LD components may use it, and only with
 * serializeJsonLd (which escapes "<"). Any new use must be reviewed, then added to ALLOWED on purpose.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const root = join(__dirname, '..')

// Explicit whitelist: path (posix) -> exact number of occurrences allowed.
const ALLOWED: Record<string, number> = {
  'src/components/MenuJsonLd.tsx': 1,
  'src/components/RestaurantJsonLd.tsx': 1,
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?|mjs)$/.test(name)) out.push(full)
  }
  return out
}

describe('dangerouslySetInnerHTML whitelist', () => {
  const found: Record<string, string> = {}
  for (const file of walk(join(root, 'src'))) {
    const src = readFileSync(file, 'utf8')
    if (src.includes('dangerouslySetInnerHTML')) found[relative(root, file).split(sep).join('/')] = src
  }

  it('appears only in the whitelisted JSON-LD components', () => {
    expect(Object.keys(found).sort()).toEqual(Object.keys(ALLOWED).sort())
  })

  it('each whitelisted use is exactly serializeJsonLd output', () => {
    for (const [path, src] of Object.entries(found)) {
      const uses = src.match(/dangerouslySetInnerHTML/g) ?? []
      expect(uses.length, path).toBe(ALLOWED[path])
      expect(src, path).toContain('dangerouslySetInnerHTML={{ __html: serializeJsonLd(')
      expect(src, path).toContain('application/ld+json')
    }
  })
})
