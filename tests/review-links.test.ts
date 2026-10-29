/**
 * Review link helpers (REV-01): UUID/source guards, Accept-Language parsing,
 * locale resolution, redirect path building and centralized review URLs.
 */

import { describe, it, expect } from 'vitest'
import {
  isReviewToken,
  sanitizeReviewSource,
  pickAcceptLanguage,
  resolveReviewLocale,
  buildReviewRedirectPath,
  normalizeReviewSource,
  REVIEW_STAT_SOURCES,
  REVIEW_HIT_KINDS,
} from '../src/utils/review-links'
import { googleReviewUrl, tripAdvisorReviewUrl } from '../src/utils/seo'

const UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('review URLs', () => {
  it('googleReviewUrl uses the place id', () => {
    expect(googleReviewUrl()).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJozpAo2GUUTARABLcICH3H7I'
    )
  })

  it('tripAdvisorReviewUrl uses UserReviewEdit on .com', () => {
    expect(tripAdvisorReviewUrl()).toMatch(
      /^https:\/\/www\.tripadvisor\.com\/UserReviewEdit-g297927-d2413872-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province\.html$/
    )
  })
})

describe('isReviewToken', () => {
  it.each([UUID, UUID.toUpperCase()])('accepts %s', (v) => {
    expect(isReviewToken(v)).toBe(true)
  })

  it.each(['', '123', UUID + 'x', 'x' + UUID, null, undefined])('rejects %s', (v) => {
    expect(isReviewToken(v as string | null | undefined)).toBe(false)
  })
})

describe('sanitizeReviewSource', () => {
  it.each(['email', 'qr', 'wa', 'site'])('accepts %s', (v) => {
    expect(sanitizeReviewSource(v)).toBe(v)
  })

  it.each(['EMAIL ', 'javascript:', '', 'Email', null, undefined])('rejects %s', (v) => {
    expect(sanitizeReviewSource(v as string | null | undefined)).toBeNull()
  })
})

describe('normalizeReviewSource', () => {
  it('exposes the stat sources and hit kinds', () => {
    expect([...REVIEW_STAT_SOURCES]).toEqual(['email', 'qr', 'wa', 'site', 'unknown'])
    expect([...REVIEW_HIT_KINDS]).toEqual(['visit', 'google', 'tripadvisor'])
  })

  it.each([
    ['qr', null, 'qr'],
    ['wa', UUID, 'email'],
    [undefined, 'not-a-uuid', 'unknown'],
    [['qr'], null, 'unknown'],
    ['unknown', null, 'unknown'],
    ['<x>', null, 'unknown'],
  ] as const)('%j + %j -> %s', (src, rid, expected) => {
    expect(normalizeReviewSource(src, rid)).toBe(expected)
  })
})

describe('pickAcceptLanguage', () => {
  it.each([
    ['fr-FR,fr;q=0.9,en;q=0.8', 'fr'],
    ['de-DE,de;q=0.9,en;q=0.8', 'de'],
    ['en-GB', 'en'],
    ['sv-SE', 'en'],
    ['es-ES,it', null],
    ['', null],
    [null, null],
    ['en;q=0.5,fr;q=0.9', 'fr'],
  ])('%s -> %s', (header, expected) => {
    expect(pickAcceptLanguage(header as string | null)).toBe(expected)
  })
})

describe('resolveReviewLocale', () => {
  it.each([
    [{ ridLocale: 'fr', hint: 'de', acceptLanguage: 'en' }, 'fr'],
    [{ ridLocale: 'de', hint: 'fr', acceptLanguage: 'fr' }, 'de'],
    [{ ridLocale: 'sv' }, 'en'],
    [{ ridLocale: 'xx', hint: 'fr' }, 'fr'],
    [{ hint: 'fr', acceptLanguage: 'en' }, 'fr'],
    [{ hint: 'de', acceptLanguage: 'fr' }, 'de'],
    [{ acceptLanguage: 'fr-FR' }, 'fr'],
    [{ acceptLanguage: 'es-ES' }, 'en'],
    [{}, 'en'],
  ] as const)('%j -> %s', (args, expected) => {
    expect(resolveReviewLocale(args as Parameters<typeof resolveReviewLocale>[0])).toBe(expected)
  })
})

describe('buildReviewRedirectPath', () => {
  it('forwards a valid rid and src', () => {
    expect(buildReviewRedirectPath('fr', { rid: UUID, src: 'email' })).toBe(
      `/fr/review?rid=${UUID}&src=email`
    )
  })

  it('drops invalid rid and unknown src', () => {
    expect(buildReviewRedirectPath('en', { rid: 'nope', src: 'evil' })).toBe('/en/review')
  })

  it('has no query when no params', () => {
    expect(buildReviewRedirectPath('en', {})).toBe('/en/review')
  })
})
