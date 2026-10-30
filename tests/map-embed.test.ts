/**
 * Plan 05-10: "Comment venir", single directions button and click-to-load map (CONV-03).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { googleDirectionsUrl, googleMapsEmbedUrl, GOOGLE_PLACE_ID } from '../src/utils/seo'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const fr = JSON.parse(read('messages/fr.json'))
const en = JSON.parse(read('messages/en.json'))
const page = read('src/app/[locale]/page.tsx')
const map = read('src/components/MapEmbed.tsx')

describe('seo url helpers', () => {
  it('builds the directions url', () => {
    expect(googleDirectionsUrl()).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=8.061436,98.915598&destination_place_id=' + GOOGLE_PLACE_ID,
    )
  })
  it('builds the embed url', () => {
    const u = googleMapsEmbedUrl()
    expect(u.startsWith('https://www.google.com/maps?')).toBe(true)
    expect(u).toContain('output=embed')
    expect(u).toContain('8.061436,98.915598')
  })
})

describe('MapEmbed component', () => {
  it('is a client component with a deferred iframe', () => {
    expect(map.trimStart().startsWith("'use client'")).toBe(true)
    expect((map.match(/<iframe/g) ?? []).length).toBe(1)
    expect(map.indexOf('<iframe')).toBeGreaterThan(map.indexOf('loaded'))
    expect(map).toContain('useState(false)')
    expect(map).toContain('loading="lazy"')
    expect(map).toContain('title=')
    expect(map).toContain('referrerPolicy="no-referrer-when-downgrade"')
  })
  it('shows a static preview button first, at fixed height', () => {
    expect(map).toContain('<button')
    expect(map).toContain('type="button"')
    expect(map).toContain('<Image')
    expect(map).toContain('/exterior-sign.jpg')
    expect(map).toContain('h-72')
    expect(map).toContain('md:h-80')
    expect(map).toContain('aria-live="polite"')
  })
})

describe('page.tsx #contact', () => {
  it('wires directions, trajets and map', () => {
    expect(page).toContain('<MapEmbed')
    expect(page).toContain('googleDirectionsUrl()')
    expect(page.split("t('home.directionsLink')").length - 1).toBe(1)
    expect(page).toContain("t('contactSection.gettingHereTitle')")
    for (const k of ['aoNang', 'songthaew', 'walkingStreet', 'chaoFah']) {
      expect(page).toContain(`contactSection.gettingHere.${k}`)
    }
    expect(page).not.toContain('<iframe')
  })
  it('has the trajets copy', () => {
    const f = fr.contactSection.gettingHere
    expect(f.aoNang).toMatch(/Ao Nang/)
    expect(f.aoNang).toContain('20 min')
    expect(f.songthaew).toMatch(/Songthaew/)
    expect(f.songthaew).toContain('50')
    expect(f.walkingStreet).toContain('Walking Street')
    expect(f.walkingStreet).toContain('3 min')
    expect(f.chaoFah).toContain('Chao Fah')
    expect(f.chaoFah).toContain('15 min')
    const e = en.contactSection.gettingHere
    expect(e.aoNang).toContain('20 min')
    expect(e.songthaew).toContain('50 baht')
    expect(e.walkingStreet).toContain('3 min')
    expect(e.chaoFah).toContain('15 min')
  })
})
