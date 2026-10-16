/**
 * Dependency declaration test: every bare package imported from src/ must be
 * declared in package.json (no transitive-only imports), and zod is declared.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { builtinModules } from 'node:module'

const root = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
])

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

function packageRoot(spec: string): string {
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/')
  return spec.split('/')[0]
}

describe('dependencies', () => {
  it('declares zod', () => {
    expect(pkg.dependencies.zod).toBeDefined()
  })

  it('declares every bare package imported in src/', () => {
    const builtins = new Set(builtinModules)
    const re = /(?:from\s+|import\s*\(\s*)'([^']+)'/g
    const missing = new Set<string>()
    for (const file of walk(join(root, 'src'))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(re)) {
        const spec = m[1]
        if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:')) continue
        const name = packageRoot(spec)
        if (builtins.has(name)) continue
        if (!declared.has(name)) missing.add(name)
      }
    }
    expect([...missing]).toEqual([])
  })

  it('no longer depends on twilio', () => {
    expect(pkg.dependencies?.twilio).toBeUndefined()
    expect(pkg.devDependencies?.twilio).toBeUndefined()
  })

  it('has no SMS/OTP code path left in src/', () => {
    expect(existsSync(join(root, 'src/app/api/verify'))).toBe(false)
    const offenders: string[] = []
    for (const file of walk(join(root, 'src'))) {
      const text = readFileSync(file, 'utf8')
      for (const needle of ['twilio', 'api/verify', 'phone_verification', 'isOtpCode']) {
        if (text.includes(needle)) offenders.push(`${file}: ${needle}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
