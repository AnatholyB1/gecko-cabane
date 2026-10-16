/**
 * Source-scan contract test for the OTP-free reservation form (plan 01-07).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const src = readFileSync(join(root, 'src/components/ReservationForm.tsx'), 'utf8')
const fr = JSON.parse(readFileSync(join(root, 'messages/fr.json'), 'utf8')).reservationForm
const en = JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf8')).reservationForm

describe('ReservationForm source', () => {
  it('has no OTP / SMS verification remnants', () => {
    for (const bad of ['api/verify', 'phone_verification_token', 'PhoneVerifState']) {
      expect(src).not.toContain(bad)
    }
    expect(src.toLowerCase()).not.toContain('otp')
  })

  it('contains the required contract markers', () => {
    for (const needle of [
      'id="reservation-submit"',
      'name="company_url"',
      'form_started_at',
      'marketing_consent',
      'phone_country',
      'useLocale',
      'bookableSlots(',
      'buildWhatsAppUrl(',
      'bangkokNow(',
    ]) {
      expect(src).toContain(needle)
    }
  })

  it('makes the email input required with type="email"', () => {
    const start = src.indexOf('id="res-email"')
    expect(start).toBeGreaterThan(-1)
    const block = src.slice(start, src.indexOf('/>', start))
    expect(block).toContain('required')
    expect(block).toContain('type="email"')
  })

  it('does not pre-check the consent checkbox', () => {
    expect(src).not.toContain('defaultChecked={true}')
    expect(src).not.toContain('checked={true}')
    expect(src).toMatch(/useState\(false\)/)
    expect(src).toMatch(/\[marketingConsent, setMarketingConsent\] = useState\(false\)/)
  })

  it('has no hard-coded French error literals', () => {
    expect(src).not.toContain('Une erreur est survenue')
    expect(src).not.toContain('Erreur de connexion')
  })
})

describe('reservationForm messages', () => {
  const required = [
    'emailInvalid', 'phoneInvalid', 'marketingConsent', 'privacyNote', 'genericError',
    'networkError', 'rateLimited', 'rateLimitedWhatsapp', 'slotUnavailable', 'slotFull',
    'datePast', 'partySizeDecrease', 'partySizeIncrease',
  ]

  for (const [name, msgs] of [['fr', fr], ['en', en]] as const) {
    it(`${name} has no otp* keys`, () => {
      expect(Object.keys(msgs).filter((k) => k.startsWith('otp'))).toEqual([])
    })
    it(`${name} has all new keys`, () => {
      for (const k of required) expect(msgs[k], k).toBeTruthy()
    })
  }
})
