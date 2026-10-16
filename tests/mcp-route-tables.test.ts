import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The Supabase project is shared with another app: every table this site
// queries must carry the gecko_ prefix. The MCP route once queried unprefixed
// names, which broke every tool (or read the other app's data).
const source = readFileSync(join(__dirname, '../src/app/api/mcp/route.ts'), 'utf8')

describe('MCP route table names', () => {
  const tables = [...source.matchAll(/\.from\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1])

  it('queries at least one table', () => {
    expect(tables.length).toBeGreaterThan(0)
  })

  it('only queries gecko_-prefixed tables', () => {
    expect(tables.filter((t) => !t.startsWith('gecko_'))).toEqual([])
  })

  it('reads reservation counts with the service-role client, selecting only party_size', () => {
    expect(source).toMatch(/createAdminClient\(\)/)
    expect(source).toMatch(/\.from\("gecko_reservations"\)\s*\.select\("party_size"\)/)
  })
})

describe('MCP route transport', () => {
  it('uses plain JSON responses (SSE stream was closed before being read)', () => {
    expect(source).toMatch(/enableJsonResponse:\s*true/)
  })
})
