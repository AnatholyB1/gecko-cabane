/**
 * Doc-scan gate for docs/ph6 (OPS-02..OPS-05, plan 06-03).
 * The documents are owner-facing drafts: nothing is sent or published from code.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildRestaurantJsonLd } from '../src/utils/seo'

const DIR = join(process.cwd(), 'docs/ph6')
const FILES = [
  'README.md',
  'nap-audit.md',
  'tripadvisor-update.md',
  'google-posts-fr-en.md',
  'review-replies.md',
]

function read(name: string): string {
  return readFileSync(join(DIR, name), 'utf8')
}

describe('docs/ph6 owner documents', () => {
  it('the five files exist and start with a Statut line', () => {
    for (const f of FILES) {
      expect(existsSync(join(DIR, f)), f).toBe(true)
      const first = read(f).split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
      expect(first.startsWith('Statut :'), `${f} first line`).toBe(true)
    }
  })

  it('README: rule, file index and open owner decisions', () => {
    const t = read('README.md')
    expect(t).toContain("Rien n'est envoyé ni publié sans accord écrit du propriétaire")
    const listed = [
      'README.md',
      'nap-audit.md',
      'tripadvisor-update.md',
      'google-posts-fr-en.md',
      'review-replies.md',
      'outreach-targets.md',
      'outreach-messages.md',
      'concierge-dossier.md',
      'concierge-dossier.pdf',
      'review/de/',
      'review/sv/',
      'review/en/wine-belgian-beer-krabi.md',
    ]
    for (const name of listed) expect(t, name).toContain(name)
    const idx = t.indexOf('## Points à trancher par le propriétaire')
    expect(idx).toBeGreaterThan(-1)
    const section = t.slice(idx)
    for (const word of ['étoiles', 'alcool', 'Ao Nang', 'relecteur', 'Specs site Gecko Cabane']) {
      expect(section, word).toContain(word)
    }
  })

  it('NAP audit: canonical values come from the JSON-LD builder', () => {
    const t = read('nap-audit.md')
    const ld = buildRestaurantJsonLd({ locale: 'en', description: '', hoursRows: [] }) as {
      address: { streetAddress: string; postalCode: string; addressLocality: string }
    }
    expect(t).toContain(ld.address.streetAddress)
    expect(t).toContain(ld.address.postalCode)
    expect(t).toContain(ld.address.addressLocality)
    expect(t).toContain('+66 81 958 5945')
    expect(t).toContain('+66819585945')
    expect(t).toContain('https://geckocabanerestaurant.com')
    for (const s of ['Google', 'TripAdvisor', 'Facebook', 'Trip.com', 'Wanderlog']) {
      expect(t, s).toContain(s)
    }
  })

  it('Google posts: 8 posts, reservation links, placeholder, no phone, no alcohol', () => {
    const t = read('google-posts-fr-en.md')
    expect((t.match(/^### Semaine [1-4] — (FR|EN)$/gm) ?? []).length).toBe(8)
    expect(t).toContain('https://geckocabanerestaurant.com/fr#reservation')
    expect(t).toContain('https://geckocabanerestaurant.com/en#reservation')
    expect(t).toContain('[À COMPLÉTER PAR LE PROPRIÉTAIRE]')
    expect(t).not.toMatch(/\+66/)
    expect(t).not.toMatch(/\b(vins?|wines?|beers?|bi[eè]res?|cocktails?|alcool|alcohol)\b/i)
  })

  it('review replies: FR/EN/DE templates, phrase, 48 h, no incentive', () => {
    const t = read('review-replies.md')
    for (const h of ['## FR', '## EN', '## DE']) expect(t).toContain(h)
    expect((t.match(/French restaurant in Krabi Town/g) ?? []).length).toBeGreaterThanOrEqual(21)
    expect(t).toContain('48 h')
    expect(t).not.toMatch(
      /\b(réduction|discount|rabatt|gratuit|kostenlos|offert|for free|free (drink|dessert|meal|glass))\b/i,
    )
  })

  it('TripAdvisor update: site link, phrase, no rating or ranking claim', () => {
    const t = read('tripadvisor-update.md')
    expect(t).toContain('tripadvisor.com')
    expect(t).toContain('https://geckocabanerestaurant.com')
    expect(t).toContain('French restaurant in Krabi Town')
    expect(t).not.toMatch(/\b(étoiles|stars|#1|meilleur|best)\b/i)
  })
})
