/**
 * Source scan for leaked server secrets (SEC-05)
 *
 * - no webhook (RESA_*) code or NEXT_PUBLIC_RESA* variable may exist (webhooks removed)
 * - client components must not reference server-only secrets
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, sep } from 'path'

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) out.push(p)
  }
  return out
}

const files = walk(join(process.cwd(), 'src')).map((p) => ({ p, src: readFileSync(p, 'utf-8') }))

describe('no secrets in the public bundle', () => {
  it('no NEXT_PUBLIC_RESA reference under src/', () => {
    const offenders = files.filter((f) => f.src.includes('NEXT_PUBLIC_RESA')).map((f) => f.p)
    expect(offenders).toEqual([])
  })

  it('no webhook code or RESA_* env read remains under src/ (SEC-05 satisfied by removal)', () => {
    const offenders = files
      .filter((f) => /RESA_[A-Z_]*HOOK|webhookUrl|validationWebhookUrl|n8n/i.test(f.src))
      .map((f) => f.p)
    expect(offenders).toEqual([])
  })

  it('reservations route performs no outgoing fetch()', () => {
    const route = files.find((f) => f.p.split(sep).join('/').endsWith('src/app/api/reservations/route.ts'))
    expect(route).toBeDefined()
    expect(route!.src).not.toMatch(/\bfetch\(/)
  })

  it("'use client' files never reference SUPABASE_SERVICE_ROLE_KEY or RATE_LIMIT_SECRET", () => {
    const offenders = files
      .filter((f) => /^\s*['"]use client['"]/m.test(f.src))
      .filter((f) => f.src.includes('SUPABASE_SERVICE_ROLE_KEY') || f.src.includes('RATE_LIMIT_SECRET'))
      .map((f) => f.p)
    expect(offenders).toEqual([])
  })
})
