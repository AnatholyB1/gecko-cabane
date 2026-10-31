/**
 * Phase 9 fix: POST /api/auth/signup (unguarded supabase.auth.signUp on the
 * auth pool shared with another app) is removed. Fails if the route returns.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

describe('signup API removal', () => {
  it('has no src/app/api/auth/signup route', () => {
    expect(existsSync(join(root, 'src/app/api/auth/signup'))).toBe(false)
  })

  it('no route handler under src/app/api calls auth.signUp', () => {
    const offenders = walk(join(root, 'src/app/api'))
      .filter((f) => /route\.tsx?$/.test(f))
      .filter((f) => /\.signUp\s*\(/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('nothing in src references /api/auth/signup', () => {
    const offenders = walk(join(root, 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('/api/auth/signup'))
    expect(offenders).toEqual([])
  })
})
