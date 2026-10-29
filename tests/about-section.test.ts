/**
 * Plan 05-10: #about enrichment (CONV-02) - authenticity, gating and no new anchor.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const fr = JSON.parse(read('messages/fr.json'))
const en = JSON.parse(read('messages/en.json'))
const page = read('src/app/[locale]/page.tsx')

// id=" attributes in page.tsx at the start of plan 05-10 (no new anchor allowed, D-16)
const ID_COUNT_BEFORE = 8

function collect(o: unknown, out: string[] = []): string[] {
  if (typeof o === 'string') out.push(o)
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => collect(v, out))
  return out
}

describe('about story keys', () => {
  it('has the story keys in fr and en', () => {
    for (const m of [fr, en]) {
      for (const k of ['storyTitle', 'story1', 'couplePhotoAlt', 'coupleCaption']) {
        expect(typeof m.about[k]).toBe('string')
      }
    }
    expect(fr.about.storyTitle).toBe('Notre histoire')
    expect(en.about.storyTitle).toBe('Our story')
  })
  it('contains no placeholder text', () => {
    for (const m of [fr, en]) {
      for (const v of collect(m)) expect(v).not.toMatch(/à compléter|TODO|lorem/i)
    }
  })
})

describe('page.tsx #about', () => {
  it('renders the story inside #about between description2 and the french link', () => {
    const start = page.indexOf('id="about"')
    const end = page.indexOf('id="cuisine"')
    const s = page.slice(start, end)
    const d2 = s.indexOf('about.description2')
    const title = s.indexOf("t('about.storyTitle')")
    const story = s.indexOf("t('about.story1')")
    const link = s.indexOf('about.frenchRestaurantLink')
    expect(d2).toBeGreaterThan(-1)
    expect(title).toBeGreaterThan(d2)
    expect(story).toBeGreaterThan(title)
    expect(link).toBeGreaterThan(story)
  })
  it('gates the couple photo on COUPLE_PHOTO and ships it null', () => {
    expect(read('src/utils/about-content.ts')).toMatch(/COUPLE_PHOTO[^=]*=\s*null/)
    expect(page).toMatch(/COUPLE_PHOTO (&&|\?)/)
    const i = page.indexOf('COUPLE_PHOTO.src')
    expect(i).toBeGreaterThan(-1)
    expect(page.slice(i, i + 600)).toContain('sizes=')
  })
  it('adds no anchor and no nav item', () => {
    expect((page.match(/id="/g) ?? []).length).toBe(ID_COUNT_BEFORE)
    const header = read('src/components/SiteHeader.tsx')
    expect(header).not.toMatch(/story|histoire|getting/i)
  })
})
