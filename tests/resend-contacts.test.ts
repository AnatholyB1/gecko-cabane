/**
 * Resend contact upsert (Sentry GECKO-CABANE-R): create -> lookup -> update, real create
 * error reported, consent never re-granted by the cron, email normalized and never leaked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { captureMessage, captureException, getResendClient } = vi.hoisted(() => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  getResendClient: vi.fn(),
}))
vi.mock('@sentry/nextjs', () => ({ captureMessage, captureException }))
vi.mock('../src/utils/resend', () => ({ getResendClient: () => getResendClient() }))

import {
  upsertResendContact,
  updateResendContactProperties,
  unsubscribeResendContact,
} from '../src/utils/resend-contacts'
import type { SubscriberProfile } from '../src/utils/newsletter-segments'

const profile: SubscriberProfile = {
  email: '  Alice@Example.COM ',
  language: 'fr',
  country: 'FR',
  resident: false,
  source: 'popup',
  consentAt: '2026-11-01T10:00:00.000Z',
  lastVisit: null,
}
const NORMALIZED = 'alice@example.com'

function fake() {
  return {
    contacts: { create: vi.fn(), get: vi.fn(), update: vi.fn() },
  }
}
const err = (name: string, message = 'boom') => ({ data: null, error: { name, message, statusCode: 422 } })
const ok = (data: unknown = {}) => ({ data, error: null })

let client: ReturnType<typeof fake>

beforeEach(() => {
  vi.stubEnv('RESEND_SEGMENT_ID', '')
  captureMessage.mockReset()
  captureException.mockReset()
  client = fake()
  getResendClient.mockReturnValue(client)
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('upsertResendContact', () => {
  it('create ok: no get, no update', async () => {
    client.contacts.create.mockResolvedValue(ok())
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: true })
    expect(client.contacts.create.mock.calls[0][0].email).toBe(NORMALIZED)
    expect(client.contacts.get).not.toHaveBeenCalled()
    expect(client.contacts.update).not.toHaveBeenCalled()
  })

  it('existing contact: updates properties only, no unsubscribed key', async () => {
    client.contacts.create.mockResolvedValue(err('validation_error'))
    client.contacts.get.mockResolvedValue(ok({ unsubscribed: false }))
    client.contacts.update.mockResolvedValue(ok())
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: true })
    expect(client.contacts.get).toHaveBeenCalledWith({ email: NORMALIZED })
    const arg = client.contacts.update.mock.calls[0][0]
    expect(arg.email).toBe(NORMALIZED)
    expect(arg).not.toHaveProperty('unsubscribed')
    expect(arg.properties.language).toBe('fr')
  })

  it('unsubscribed contact on cron retry stays unsubscribed', async () => {
    client.contacts.create.mockResolvedValue(err('validation_error'))
    client.contacts.get.mockResolvedValue(ok({ unsubscribed: true }))
    client.contacts.update.mockResolvedValue(ok())
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: true })
    expect(client.contacts.update.mock.calls[0][0]).not.toHaveProperty('unsubscribed')
    expect(captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('left unsubscribed'),
      'info'
    )
  })

  it('freshOptIn re-subscribes', async () => {
    client.contacts.create.mockResolvedValue(err('validation_error'))
    client.contacts.get.mockResolvedValue(ok({ unsubscribed: true }))
    client.contacts.update.mockResolvedValue(ok())
    await upsertResendContact(profile, { freshOptIn: true, pauseMs: 0 })
    expect(client.contacts.update.mock.calls[0][0].unsubscribed).toBe(false)
  })

  it('create error + not_found: reports real create error, never updates, no email leak', async () => {
    client.contacts.create.mockResolvedValue(
      err('validation_error', 'Property language missing for alice@example.com')
    )
    client.contacts.get.mockResolvedValue(err('not_found'))
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: false })
    expect(client.contacts.update).not.toHaveBeenCalled()
    expect(captureMessage).toHaveBeenCalledTimes(1)
    const [message, hint] = captureMessage.mock.calls[0]
    expect(message).toContain('Resend contact create failed: validation_error')
    expect(JSON.stringify([message, hint]).toLowerCase()).not.toContain('alice@example.com')
  })

  it('lookup error other than not_found', async () => {
    client.contacts.create.mockResolvedValue(err('validation_error'))
    client.contacts.get.mockResolvedValue(err('rate_limit_exceeded'))
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: false })
    expect(captureMessage.mock.calls[0][0]).toContain('Resend contact lookup failed: rate_limit_exceeded')
    expect(client.contacts.update).not.toHaveBeenCalled()
  })

  it('update error', async () => {
    client.contacts.create.mockResolvedValue(err('validation_error'))
    client.contacts.get.mockResolvedValue(ok({ unsubscribed: false }))
    client.contacts.update.mockResolvedValue(err('invalid_parameter'))
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: false })
    expect(captureMessage.mock.calls[0][0]).toContain('Resend contact update failed: invalid_parameter')
  })

  it('create throws', async () => {
    client.contacts.create.mockRejectedValue(new Error('network'))
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: false })
    expect(captureMessage.mock.calls[0][0]).toContain('(network or timeout)')
  })

  it('no client: skipped', async () => {
    getResendClient.mockReturnValue(null)
    expect(await upsertResendContact(profile, { pauseMs: 0 })).toEqual({ ok: false, skipped: true })
    expect(client.contacts.create).not.toHaveBeenCalled()
  })
})

describe('email normalization in other helpers', () => {
  it('updateResendContactProperties', async () => {
    client.contacts.update.mockResolvedValue(ok())
    await updateResendContactProperties(profile)
    expect(client.contacts.update.mock.calls[0][0].email).toBe(NORMALIZED)
  })
  it('unsubscribeResendContact', async () => {
    client.contacts.update.mockResolvedValue(ok())
    await unsubscribeResendContact('  Alice@Example.COM ')
    expect(client.contacts.update.mock.calls[0][0]).toEqual({ email: NORMALIZED, unsubscribed: true })
  })
})
