import { describe, it, expect } from 'vitest'
import nextConfig from '../next.config'

type Rule = { source: string; headers: { key: string; value: string }[] }

async function rules(): Promise<Rule[]> {
  const cfg = nextConfig as unknown as { headers: () => Promise<Rule[]> }
  return cfg.headers()
}

describe('security headers contract (SEC-01..04)', () => {
  it('applies the four baseline headers to every route', async () => {
    const all = (await rules()).find((r) => r.source === '/:path*')
    expect(all).toBeDefined()
    const map = Object.fromEntries(all!.headers.map((h) => [h.key, h.value]))
    expect(map['X-Content-Type-Options']).toBe('nosniff')
    expect(map['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(map['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(map['Permissions-Policy']).toContain('camera=()')
    expect(map['Permissions-Policy']).toContain('microphone=()')
    expect(map['Permissions-Policy']).not.toContain('geolocation')
  })

  it('keeps the wifi private/no-store rule', async () => {
    const wifi = (await rules()).find((r) => r.source.includes('wifi'))
    expect(wifi?.headers).toContainEqual({ key: 'Cache-Control', value: 'private, no-store' })
  })
})
