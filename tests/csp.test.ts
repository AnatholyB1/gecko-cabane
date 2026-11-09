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

  it('upgrade-insecure-requests only when asked', () => {
    expect(prod).not.toContain('upgrade-insecure-requests')
    expect(buildCsp({ upgradeInsecureRequests: true })).toContain('upgrade-insecure-requests')
  })
})

describe('next.config exposes the CSP and the 4-language wifi rule', () => {
  it('sets Content-Security-Policy on every route', async () => {
    const csp = (await rules())
      .filter((r) => r.source === '/:path*')
      .flatMap((r) => r.headers)
      .find((h) => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp!.value).toContain("frame-ancestors 'self'")
  })

  it('wifi no-store covers fr, en, de and sv', async () => {
    const wifi = (await rules()).find((r) => r.source.includes('wifi'))
    expect(wifi?.headers).toContainEqual({ key: 'Cache-Control', value: 'private, no-store' })
    for (const l of ['fr', 'en', 'de', 'sv']) expect(wifi!.source).toContain(l)
  })
})
