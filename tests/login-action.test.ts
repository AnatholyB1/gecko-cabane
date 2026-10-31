/**
 * Connexion redessinée : erreurs en codes (jamais le message de Supabase), pas d'énumération de comptes,
 * redirection ouverte refusée. Supabase est simulé.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signIn = vi.fn()
const signOut = vi.fn()
const isGeckoAdmin = vi.fn()
const redirectSpy = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`)
})

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { signInWithPassword: signIn, signOut } })),
  isGeckoAdmin: (...a: unknown[]) => isGeckoAdmin(...a),
}))
vi.mock('next/navigation', () => ({ redirect: (u: string) => redirectSpy(u) }))

import { loginAction } from '@/app/admin/login/actions'
import { classifyAuthError, isLoginErrorCode, isLoginNoticeCode, LOGIN_ERRORS } from '@/app/admin/login/messages'

const init = { error: null, email: '' } as const
function form(values: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(values)) f.set(k, v)
  return f
}

beforeEach(() => {
  signIn.mockReset()
  signOut.mockReset()
  isGeckoAdmin.mockReset()
  redirectSpy.mockClear()
})

describe('loginAction', () => {
  it('compte inconnu et mauvais mot de passe : même réponse, jamais le message brut de Supabase', async () => {
    signIn.mockResolvedValueOnce({ error: { status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' } })
    const a = await loginAction(init, form({ email: 'inconnu@example.com', password: 'whatever-123' }))
    signIn.mockResolvedValueOnce({ error: { status: 400, code: 'email_not_confirmed', message: 'Email not confirmed' } })
    const b = await loginAction(init, form({ email: 'jariya@example.com', password: 'bad-password-1' }))
    expect(a.error).toBe('invalid')
    expect(b.error).toBe('invalid')
    expect(JSON.stringify([a, b])).not.toMatch(/Invalid login|not confirmed|credentials/i)
    expect(LOGIN_ERRORS.invalid.title).toBe('Email ou mot de passe incorrect.')
  })

  it('l’email saisi est renvoyé pour être réaffiché', async () => {
    signIn.mockResolvedValue({ error: { status: 400, message: 'x' } })
    const r = await loginAction(init, form({ email: ' jariya@example.com ', password: 'bad-password-1' }))
    expect(r.email).toBe('jariya@example.com')
  })

  it('champs absents, vides ou démesurés : refus sans appeler Supabase', async () => {
    const bad: Record<string, string>[] = [{}, { email: '', password: 'x' }, { email: 'a@b.fr', password: '' }, { email: 'a@b.fr', password: 'x'.repeat(300) }]
    for (const v of bad) {
      expect((await loginAction(init, form(v))).error).toBe('invalid')
    }
    expect(signIn).not.toHaveBeenCalled()
  })

  it('service indisponible et limitation de débit sont distingués sans fuite', () => {
    expect(classifyAuthError({ status: 500 })).toBe('unavailable')
    expect(classifyAuthError({ status: 0 })).toBe('unavailable')
    expect(classifyAuthError(undefined)).toBe('unavailable')
    expect(classifyAuthError({ status: 429 })).toBe('throttled')
    expect(classifyAuthError({ status: 400 })).toBe('invalid')
    expect(classifyAuthError({ status: 422, code: 'whatever' })).toBe('invalid')
  })

  it('compte du pool partagé sans ligne gecko_admins : déconnecté, message « pas d’accès » conservé', async () => {
    signIn.mockResolvedValue({ error: null })
    isGeckoAdmin.mockResolvedValue(false)
    const r = await loginAction(init, form({ email: 'portfolio@example.com', password: 'portfolio-pass-1' }))
    expect(r.error).toBe('noaccess')
    expect(signOut).toHaveBeenCalled()
    expect(LOGIN_ERRORS.noaccess.title).toBe("Ce compte n'a pas accès à l'administration Gecko Cabane.")
    expect(redirectSpy).not.toHaveBeenCalled()
  })

  it('administrateur : redirection vers /admin par défaut', async () => {
    signIn.mockResolvedValue({ error: null })
    isGeckoAdmin.mockResolvedValue(true)
    await expect(loginAction(init, form({ email: 'jariya@example.com', password: 'good-password-1' }))).rejects.toThrow('NEXT_REDIRECT:/admin')
  })

  it('redirection ouverte : toute cible externe ou détournée retombe sur /admin', async () => {
    signIn.mockResolvedValue({ error: null })
    isGeckoAdmin.mockResolvedValue(true)
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', '/admin@evil.example', 'javascript:alert(1)', '/fr/reservation', '/%2F%2Fevil.example', '/admin/../..//evil.example\t', 'http://localhost:3000/admin']) {
      redirectSpy.mockClear()
      await expect(loginAction(init, form({ email: 'a@b.fr', password: 'good-password-1', redirect: bad }))).rejects.toThrow(/NEXT_REDIRECT:(\/admin|\/admin\/\.\.\/\.\.\/\/evil\.example)/)
      const target = redirectSpy.mock.calls[0][0]
      expect(target.startsWith('/admin')).toBe(true)
      expect(target.startsWith('//')).toBe(false)
      expect(target).not.toContain('evil')
    }
  })

  it('cible /admin/... légitime conservée', async () => {
    signIn.mockResolvedValue({ error: null })
    isGeckoAdmin.mockResolvedValue(true)
    await expect(loginAction(init, form({ email: 'a@b.fr', password: 'good-password-1', redirect: '/admin/reservations?date=2026-11-02' }))).rejects.toThrow('NEXT_REDIRECT:/admin/reservations?date=2026-11-02')
  })
})

describe('codes d’URL de la page de connexion', () => {
  it('seuls les codes connus sont acceptés (aucun texte libre)', () => {
    expect(isLoginErrorCode('noaccess')).toBe(true)
    expect(isLoginErrorCode('<script>alert(1)</script>')).toBe(false)
    expect(isLoginErrorCode('toString')).toBe(false)
    expect(isLoginErrorCode('__proto__')).toBe(false)
    expect(isLoginErrorCode(undefined)).toBe(false)
    expect(isLoginNoticeCode('deconnecte')).toBe(true)
    expect(isLoginNoticeCode('constructor')).toBe(false)
    expect(isLoginNoticeCode('Votre compte est suspendu, appelez le 0 800 000 000')).toBe(false)
  })
})
