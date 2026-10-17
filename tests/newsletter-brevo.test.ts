import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildContactAttributes,
  buildUpsertBody,
  upsertBrevoContact,
  updateBrevoContactAttributes,
  blacklistBrevoContact,
  addToBrevoList,
  removeFromBrevoList,
} from '../src/utils/brevo'

const profile = {
  email: 'a@b.co',
  language: 'fr',
  country: null as string | null,
  resident: false,
  source: 'footer',
  consentAt: '2026-10-17T03:10:00Z',
  lastVisit: null as string | null,
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('payload builders', () => {
  it('builds exact attributes', () => {
    expect(buildContactAttributes(profile)).toEqual({
      LANGUAGE: 'fr',
      COUNTRY: '',
      RESIDENT: false,
      SOURCE: 'footer',
      CONSENT_AT: '2026-10-17',
    })
  })
  it('adds LAST_VISIT_DATE only when present', () => {
    const a = buildContactAttributes({ ...profile, country: 'DE', lastVisit: '2026-10-16' })
    expect(a.LAST_VISIT_DATE).toBe('2026-10-16')
    expect(a.COUNTRY).toBe('DE')
  })
  it('builds the upsert body', () => {
    const b = buildUpsertBody(profile, 7)
    expect(b.updateEnabled).toBe(true)
    expect(b.emailBlacklisted).toBe(false)
    expect(b.listIds).toEqual([7])
    expect(b.email).toBe('a@b.co')
  })
})

describe('IO functions', () => {
  it('skips without configuration', async () => {
    vi.stubEnv('BREVO_API_KEY', '')
    vi.stubEnv('BREVO_LIST_ID', '')
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    await expect(upsertBrevoContact(profile)).resolves.toMatchObject({ ok: false, skipped: true })
    expect(spy).not.toHaveBeenCalled()
  })
  it('posts to Brevo with the api-key header', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('BREVO_LIST_ID', '5')
    const spy = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', spy)
    const r = await upsertBrevoContact(profile)
    expect(r.ok).toBe(true)
    const [url, init] = spy.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/contacts')
    expect(init.method).toBe('POST')
    expect(init.headers['api-key']).toBe('k')
  })
  it('never throws on fetch rejection', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('BREVO_LIST_ID', '5')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    await expect(upsertBrevoContact(profile)).resolves.toMatchObject({ ok: false })
  })
  it('update never sends listIds and encodes the email', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('BREVO_LIST_ID', '5')
    const spy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', spy)
    await updateBrevoContactAttributes('a+b@c.co', { LANGUAGE: 'en' })
    const [url, init] = spy.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/contacts/a%2Bb%40c.co')
    expect(init.method).toBe('PUT')
    const body = JSON.parse(init.body)
    expect(body).not.toHaveProperty('listIds')
    expect(body.attributes).toEqual({ LANGUAGE: 'en' })
  })
  it('blacklists and manages lists', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('BREVO_LIST_ID', '5')
    const spy = vi.fn().mockImplementation(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', spy)
    await blacklistBrevoContact('a@b.co')
    expect(JSON.parse(spy.mock.calls[0][1].body)).toMatchObject({
      emailBlacklisted: true,
      unlinkListIds: [5],
    })
    await addToBrevoList(5, ['a@b.co'])
    expect(spy.mock.calls[1][0]).toBe('https://api.brevo.com/v3/contacts/lists/5/contacts/add')
    await removeFromBrevoList(5, ['a@b.co'])
    expect(spy.mock.calls[2][0]).toBe('https://api.brevo.com/v3/contacts/lists/5/contacts/remove')
  })
  it('reports non-2xx as not ok', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('BREVO_LIST_ID', '5')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 400 })))
    await expect(upsertBrevoContact(profile)).resolves.toMatchObject({ ok: false, status: 400 })
  })
})
