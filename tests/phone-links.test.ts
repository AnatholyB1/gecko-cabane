import { describe, expect, it } from 'vitest'
import { phoneLinks, telLink, toE164, whatsappLink } from '../src/utils/phone-links'

describe('toE164', () => {
  it.each([
    ['+66819585945', '+66819585945'],
    ['+66 81 958 5945', '+66819585945'],
    ['  +66-81-958-5945 ', '+66819585945'],
    ['0066819585945', '+66819585945'],
    ['00 66 81 958 5945', '+66819585945'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['+33 (0)6 12 34 56 78', '+33612345678'], // trunk zero dropped by libphonenumber
    ['+49 151 23456789', '+4915123456789'],
    ['+46 70 123 45 67', '+46701234567'],
    ['+44 7911 123456', '+447911123456'],
  ])('%s -> %s', (raw, expected) => {
    expect(toE164(raw)).toBe(expected)
  })
  it.each([
    [null], [undefined], [''], ['   '], ['abc'], ['+'], ['+0'], ['+66'], ['+66 12'],
    ['0819585945'], // national format, no country: never guessed
    ['819585945'],
    ['+999 123456789'],
  ])('invalid %s -> null', (raw) => {
    expect(toE164(raw as string | null | undefined)).toBeNull()
  })
})

describe('links', () => {
  it('builds tel: and wa.me links from the same E.164', () => {
    expect(telLink('+66 81 958 5945')).toBe('tel:+66819585945')
    expect(whatsappLink('+66 81 958 5945')).toBe('https://wa.me/66819585945')
    expect(whatsappLink('0033612345678')).toBe('https://wa.me/33612345678')
  })
  it('wa.me contains digits only (no +)', () => {
    expect(whatsappLink('+4915123456789')).toMatch(/^https:\/\/wa\.me\/\d+$/)
  })
  it('invalid numbers give no link at all', () => {
    expect(telLink('12')).toBeNull()
    expect(whatsappLink('n/a')).toBeNull()
    expect(phoneLinks(null)).toEqual({ tel: null, whatsapp: null })
    expect(phoneLinks('+66819585945')).toEqual({
      tel: 'tel:+66819585945',
      whatsapp: 'https://wa.me/66819585945',
    })
  })
  it('never injects non-phone content into the href', () => {
    expect(telLink('+66819585945;javascript:alert(1)')).toBeNull()
    expect(whatsappLink('+66819585945?text=x')).toBeNull()
  })
})
