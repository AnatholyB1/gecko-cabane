/**
 * Smoke tests for the review print artifacts (REV-04).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

const ROOT = path.resolve(__dirname, '..')
const URL = 'https://geckocabanerestaurant.com/review?src=qr'
const SVG = path.join(ROOT, 'docs/print/review-qr.svg')
const INSERT = path.join(ROOT, 'docs/print/review-addition-insert.pdf')
const TENT = path.join(ROOT, 'docs/print/review-chevalet-a6.pdf')
const README = path.join(ROOT, 'docs/print/README.md')
const SCRIPT = path.join(ROOT, 'scripts/generate-review-print.mjs')

const FORBIDDEN = /\b(remise|offert|cadeau|gagner|discount|free|gift|win|reward)\b|5 étoiles|5 stars/i

describe('review print artifacts', () => {
  it('artifacts exist and PDFs are valid', () => {
    for (const f of [SVG, INSERT, TENT, README]) expect(fs.existsSync(f)).toBe(true)
    for (const f of [INSERT, TENT]) {
      expect(fs.readFileSync(f).subarray(0, 5).toString('latin1')).toBe('%PDF-')
    }
  })

  it('script holds the QR URL constant', () => {
    const src = fs.readFileSync(SCRIPT, 'utf8')
    expect(src).toContain(`REVIEW_QR_URL = '${URL}'`)
  })

  it('committed SVG encodes the URL', async () => {
    const expected = await QRCode.toString(URL, {
      type: 'svg',
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#0D1F17', light: '#FFFFFF' },
    })
    expect(fs.readFileSync(SVG, 'utf8').replace(/
/g, '
')).toBe(expected)
  })

  it('README flags the DE text for proofreading', () => {
    expect(fs.readFileSync(README, 'utf8')).toContain('à relire')
  })

  it('copy contains no incentive wording', () => {
    const src = fs.readFileSync(SCRIPT, 'utf8')
    const copy = src.slice(src.indexOf('const COPY'), src.indexOf('const CAPTION'))
    expect(copy.length).toBeGreaterThan(100)
    expect(copy).not.toMatch(FORBIDDEN)
    const readme = fs.readFileSync(README, 'utf8')
    // The README mentions the rule itself ("Aucune contrepartie"); the forbidden list must not match.
    expect(readme).not.toMatch(FORBIDDEN)
  })
})
