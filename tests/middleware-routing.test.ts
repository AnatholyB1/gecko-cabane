/**
 * Phase 18 (PERF-01, D-01): public pages never touch Supabase in the middleware; /admin, /api and /auth
 * keep the session. No app/layout.tsx: each root layout owns its <html> so the locale is static.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { classifyPath } from '../src/utils/middleware-routing'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('classifyPath', () => {
  it.each(['/fr', '/en', '/de', '/sv', '/fr/menu', '/en/privacy', '/de/french-restaurant-krabi', '/fr/newsletter', '/fr/wifi', '/'])(
    '%s is public (no session)',
    (p) => expect(classifyPath(p)).toBe('public'),
  )
  it.each(['/admin', '/admin/login', '/admin/menu/3', '/api/reservations', '/api/hours', '/auth/callback'])(
    '%s keeps the session',
    (p) => expect(classifyPath(p)).toBe('session'),
  )
  it.each(['/review', '/avis', '/bewertung', '/newsletter', '/wifi'])('%s is an alias (no session, no i18n)', (p) =>
    expect(classifyPath(p)).toBe('alias'),
  )
  it('leaves the Sentry tunnel alone', () => expect(classifyPath('/monitoring')).toBe('monitoring'))
})

describe('middleware wiring', () => {
  const src = read('src/middleware.ts')
  it('returns the intl response for public pages before creating a Supabase client', () => {
    const publicBranch = src.indexOf("kind === 'public'")
    const client = src.indexOf('createServerClient(')
    expect(publicBranch).toBeGreaterThan(-1)
    expect(client).toBeGreaterThan(publicBranch)
    expect(src.slice(publicBranch, client)).toContain('return intlMiddleware(request)')
  })
  it('still guards /admin with getUser and gecko_is_admin', () => {
    expect(src).toContain('supabase.auth.getUser()')
    expect(src).toContain("rpc('gecko_is_admin')")
  })
})

describe('static public HTML contract', () => {
  it('has no app/layout.tsx: the locale layout and the admin layout are the root layouts', () => {
    expect(existsSync(join(root, 'src/app/layout.tsx'))).toBe(false)
    expect(read('src/app/[locale]/layout.tsx')).toContain('<html lang={locale}>')
    expect(read('src/app/admin/layout.tsx')).toContain('<html lang="fr">')
  })
  it('never reads the locale from headers on the public layout and home page', () => {
    for (const f of ['src/app/[locale]/layout.tsx', 'src/app/[locale]/page.tsx']) {
      const s = read(f)
      expect(s).not.toMatch(/getLocale\(|headers\(\)|cookies\(\)/)
      expect(s).toContain('setRequestLocale(locale)')
    }
  })
  it('keeps /[locale]/wifi private and no-store, and caches the Plausible script', () => {
    const cfg = read('next.config.ts')
    expect(cfg).toContain("'/:locale(fr|en|de|sv)/wifi'")
    expect(cfg).toContain("'private, no-store'")
    expect(cfg).toMatch(/source: '\/gcm\/js\/script\.js'[\s\S]*max-age=\d{6,}/)
    expect(read('src/app/[locale]/wifi/page.tsx')).toContain("dynamic = 'force-dynamic'")
  })
})
