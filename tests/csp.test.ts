import { describe, it, expect } from 'vitest'
import { buildCsp } from '../src/utils/csp'
import nextConfig from '../next.config'

type Rule = { source: string; headers: { key: string; value: string }[] }
const rules = () => (nextConfig as unknown as { headers: () => Promise<Rule[]> }).headers()

function directive(csp: string, name: string): string[] {
  const d = csp.split('; ').find((x) => x.startsWith(name + ' '))
  return d ? d.split(' ').slice(1) : []
}

describe('CSP module (SEC-05)', () => {
  const prod = buildCsp()

  it('never allows eval in production, only in dev', () => {
    expect(prod).not.toContain('unsafe-eval')
    expect(buildCsp({ dev: true })).toContain("'unsafe-eval'")
  })

  it('has the hardening directives', () => {
    expect(directive(prod, 'frame-ancestors')).toEqual(["'self'"])
    expect(directive(prod, 'object-src')).toEqual(["'none'"])
    expect(directive(prod, 'base-uri')).toEqual(["'self'"])
    expect(directive(prod, 'form-action')).toEqual(["'self'"])
    expect(directive(prod, 'default-src')).toEqual(["'self'"])
  })

  it('pins third-party origins to the ones in use', () => {
    expect(directive(prod, 'frame-src')).toEqual(['https://www.google.com'])
    expect(directive(prod, 'connect-src')).toEqual(["'self'"])
    expect(directive(prod, 'script-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(prod).not.toContain('*')
  })

  it('img-src: strict on public (no https:, no blob:), supabase origin allowed, https: only for admin', () => {
    const sb = 'https://abc.supabase.co'
    expect(directive(prod, 'img-src')).toEqual(["'self'", 'data:'])
    expect(directive(buildCsp({ supabaseUrl: `${sb}/rest/v1` }), 'img-src')).toEqual(["'self'", 'data:', sb])
    expect(directive(buildCsp({ supabaseUrl: 'not a url' }), 'img-src')).toEqual(["'self'", 'data:'])
    expect(directive(buildCsp({ supabaseUrl: sb, admin: true }), 'img-src')).toEqual(["'self'", 'data:', sb, 'https:'])
    expect(buildCsp({ supabaseUrl: sb })).not.toContain('blob:')
    expect(directive(prod, 'font-src')).toEqual(["'self'"])
  })

  it('upgrade-insecure-requests only when asked', () => {
    expect(prod).not.toContain('upgrade-insecure-requests')
    expect(buildCsp({ upgradeInsecureRequests: true })).toContain('upgrade-insecure-requests')
  })
})

describe('next.config exposes the CSP and the 4-language wifi rule', () => {
  it('sets Content-Security-Policy on every route, with https: images on /admin only', async () => {
    const cspRules = (await rules()).filter((r) => r.headers.some((h) => h.key === 'Content-Security-Policy'))
    expect(cspRules).toHaveLength(2)
    const value = (r: Rule) => r.headers.find((h) => h.key === 'Content-Security-Policy')!.value
    const pub = cspRules.find((r) => !r.source.startsWith('/admin'))!
    const admin = cspRules.find((r) => r.source.startsWith('/admin'))!
    expect(value(pub)).toContain("frame-ancestors 'self'")
    expect(value(admin)).toContain("frame-ancestors 'self'")
    expect(directive(value(pub), 'img-src')).not.toContain('https:')
    expect(directive(value(admin), 'img-src')).toContain('https:')
  })

  it('wifi no-store covers fr, en, de and sv', async () => {
    const wifi = (await rules()).find((r) => r.source.includes('wifi'))
    expect(wifi?.headers).toContainEqual({ key: 'Cache-Control', value: 'private, no-store' })
    for (const l of ['fr', 'en', 'de', 'sv']) expect(wifi!.source).toContain(l)
  })
})
