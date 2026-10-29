/**
 * Newsletter rewards and print supports (NEWS-03/04/05): PDFs, QR targets, sourced content.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

const ROOT = path.resolve(__dirname, '..')
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
const NEWSLETTER_URL = 'https://geckocabanerestaurant.com/newsletter?src=qr'
const WIFI_URL = 'https://geckocabanerestaurant.com/wifi?src=wifi'
const SCRIPT = read('scripts/generate-newsletter-print.mjs')

const PUBLIC_PDFS = [
  'public/guide-gourmand-krabi-town-fr.pdf',
  'public/guide-gourmand-krabi-town-en.pdf',
  'public/recette-curry-crabe-fr.pdf',
  'public/recette-curry-crabe-en.pdf',
]
const PRINT_PDFS = ['docs/print/newsletter-addition-insert.pdf', 'docs/print/wifi-table-card.pdf']

const QR_OPTIONS = {
  type: 'svg' as const,
  margin: 4,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#0D1F17', light: '#FFFFFF' },
}

describe('newsletter artifacts', () => {
  it('public PDFs and print PDFs exist, start with %PDF and stay light', () => {
    for (const f of [...PUBLIC_PDFS, ...PRINT_PDFS]) {
      const buf = fs.readFileSync(path.join(ROOT, f))
      expect(buf.subarray(0, 5).toString('latin1'), f).toBe('%PDF-')
      expect(buf.length, f).toBeLessThan(5 * 1024 * 1024)
    }
  })

  it('PDF filenames match the contract of newsletter-links.ts', () => {
    const links = read('src/utils/newsletter-links.ts')
    expect(links).toContain('guide-gourmand-krabi-town-')
    expect(links).toContain('recette-curry-crabe-')
  })

  it('script holds both QR URL constants', () => {
    expect(SCRIPT).toContain(`NEWSLETTER_QR_URL = '${NEWSLETTER_URL}'`)
    expect(SCRIPT).toContain(`WIFI_QR_URL = '${WIFI_URL}'`)
  })

  it.each([
    ['docs/print/newsletter-qr.svg', NEWSLETTER_URL],
    ['docs/print/wifi-qr.svg', WIFI_URL],
  ])('committed %s encodes its URL', async (file, url) => {
    const expected = await QRCode.toString(url, QR_OPTIONS)
    expect(read(file).split('\r\n').join('\n')).toBe(expected)
  })

  it('bill insert carries no review wording and the WiFi card no password value', () => {
    const insertCopy = SCRIPT.slice(SCRIPT.indexOf('const INSERT_COPY'), SCRIPT.indexOf('const WIFI_COPY'))
    expect(insertCopy).not.toMatch(/\b(avis|review|google|tripadvisor)\b/i)
    const wifiCopy = SCRIPT.slice(SCRIPT.indexOf('const WIFI_COPY'), SCRIPT.indexOf('const pt ='))
    expect(wifiCopy).toMatch(/mot de passe/)
    expect(SCRIPT).not.toMatch(/WIFI_PASSWORD|password\s*[:=]\s*['"][^'"]+['"]/)
  })

  it('refuses to generate from empty content (nothing invented)', () => {
    expect(SCRIPT).toContain('process.exit(1)')
    expect(SCRIPT).toContain('the owner must supply')
  })
})

describe('guide and recipe content', () => {
  const guide = JSON.parse(read('docs/newsletter/guide-content.json'))
  const recipe = JSON.parse(read('docs/newsletter/recipe-content.json'))
  const sources = read('docs/newsletter/SOURCES.md')

  it('has places and recipe steps, in FR and EN, with no DE/SV', () => {
    expect(guide.places.length).toBeGreaterThanOrEqual(8)
    for (const p of guide.places) {
      expect(p.why.fr.length, p.name.fr).toBeGreaterThan(20)
      expect(p.why.en.length, p.name.fr).toBeGreaterThan(20)
      expect(p.name.en, p.name.fr).toBeTruthy()
    }
    expect(recipe.ingredients.length).toBeGreaterThan(0)
    expect(recipe.steps.length).toBeGreaterThan(0)
    expect(Object.keys(guide.locales)).toEqual(['fr', 'en'])
  })

  it('invents no precise data: no Maps link or phone number, volatile facts flagged', () => {
    for (const p of guide.places) {
      expect(p.mapsUrl).toBe('')
      expect(JSON.stringify(p)).not.toMatch(/\+\d{2}[ \d]{8,}/)
    }
    const volatile = guide.places.filter((p: { why: { fr: string } }) =>
      /baht|horaires|heures|prix|17h/.test(p.why.fr)
    )
    for (const p of volatile) expect(p.why.fr.toLowerCase(), p.name.fr).toContain('à vérifier sur place')
  })

  it('every place is traceable in SOURCES.md and sources are http(s) URLs', () => {
    for (const p of guide.places) {
      const key = String(p.name.fr).split(' (')[0].replace(/^La p/, 'P').split(' de la rivière')[0]
      expect(sources, key).toContain(key)
    }
    expect((sources.match(/https?:\/\/[^\s;)]+/g) ?? []).length).toBeGreaterThanOrEqual(6)
    expect(sources).toContain('n\'est pas celle de la cheffe Jariya')
  })

  it('titles do not attribute the recipe to the chef', () => {
    expect(JSON.stringify(recipe.locales)).not.toMatch(/jariya/i)
    const m = JSON.parse(read('messages/fr.json')).newsletter.page
    expect(m.title).not.toMatch(/jariya/i)
  })
})
