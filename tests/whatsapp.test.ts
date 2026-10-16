/**
 * WhatsApp URL utility tests
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  buildWhatsAppUrl,
  getWhatsAppNumber,
  WHATSAPP_FALLBACK_NUMBER,
} from '../src/utils/whatsapp'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('buildWhatsAppUrl', () => {
  it('encodes the prefilled message', () => {
    expect(
      buildWhatsAppUrl('66819585945', 'Bonjour Gecko Cabane, je souhaite réserver une table.')
    ).toBe(
      'https://wa.me/66819585945?text=Bonjour%20Gecko%20Cabane%2C%20je%20souhaite%20r%C3%A9server%20une%20table.'
    )
  })

  it('strips +, spaces and dashes from the number', () => {
    expect(buildWhatsAppUrl('+66 81-958 5945', 'x')).toBe('https://wa.me/66819585945?text=x')
  })
})

describe('getWhatsAppNumber', () => {
  it('falls back to the restaurant number when env is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '')
    expect(getWhatsAppNumber()).toBe('66819585945')
    expect(WHATSAPP_FALLBACK_NUMBER).toBe('66819585945')
  })

  it('normalizes the env value to digits', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+66819585945')
    expect(getWhatsAppNumber()).toBe('66819585945')
  })
})
