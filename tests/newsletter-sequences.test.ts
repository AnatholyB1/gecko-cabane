import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  planSequenceSends,
  activeCampaigns,
  sendKey,
  type SequenceCandidate,
} from '../src/utils/newsletter-sequences'
import {
  sequenceEmail,
  newsletterWelcomeEmail,
  newsletterConfirmEmail,
  newsletterLegacyConfirmEmail,
  EMAIL_BANDS,
  type SequenceKind,
} from '../src/utils/newsletter-emails'

const root = join(__dirname, '..')
const ON = { sequencesEnabled: true, campaignsEnabled: true }

function cand(over: Partial<SequenceCandidate> = {}): SequenceCandidate {
  return { email: 'a@x.com', rowId: 1, language: 'en', lastVisit: null, resident: false, ...over }
}

describe('planSequenceSends: J+2 and J+3', () => {
  const base = { today: '2026-10-20', sent: new Set<string>(), lastCampaign: new Map<string, string>() }

  it('sends J+2 at 2 days and keeps a catch-up window of 4 days', () => {
    for (const lastVisit of ['2026-10-18', '2026-10-17', '2026-10-16']) {
      const out = planSequenceSends([cand({ lastVisit })], { ...base, ...ON, campaignsEnabled: false })
      expect(out.some((p) => p.kind === 'after_visit_j2'), lastVisit).toBe(true)
    }
    for (const lastVisit of ['2026-10-19', '2026-10-15']) {
      const out = planSequenceSends([cand({ lastVisit })], { ...base, ...ON, campaignsEnabled: false })
      expect(out.some((p) => p.kind === 'after_visit_j2'), lastVisit).toBe(false)
    }
  })

  it('sends J+3 to tourists only', () => {
    const tourist = planSequenceSends([cand({ lastVisit: '2026-10-17' })], { ...base, ...ON, campaignsEnabled: false })
    const resident = planSequenceSends([cand({ lastVisit: '2026-10-17', resident: true })], {
      ...base,
      ...ON,
      campaignsEnabled: false,
    })
    expect(tourist.map((p) => p.kind)).toContain('during_stay_j3')
    expect(resident.map((p) => p.kind)).not.toContain('during_stay_j3')
  })

  it('never sends the same email twice (dedup by visit date)', () => {
    const sent = new Set([sendKey('A@x.com', 'after_visit_j2', '2026-10-18')])
    const out = planSequenceSends([cand({ lastVisit: '2026-10-18' })], { ...base, ...ON, sent, campaignsEnabled: false })
    expect(out.some((p) => p.kind === 'after_visit_j2')).toBe(false)
  })

  it('sends nothing for contacts without a visit date, or when disabled', () => {
    expect(planSequenceSends([cand()], { ...base, ...ON, campaignsEnabled: false })).toEqual([])
    expect(
      planSequenceSends([cand({ lastVisit: '2026-10-18' })], { ...base, sequencesEnabled: false, campaignsEnabled: false })
    ).toEqual([])
  })
})

describe('planSequenceSends: seasonal campaigns and the 1-per-month cap', () => {
  const sent = new Set<string>()
  it('october return: tourists with a visit, in October only', () => {
    const o = { today: '2026-10-29', sent, lastCampaign: new Map<string, string>(), ...ON }
    expect(activeCampaigns('2026-10-29')).toEqual(['october_return'])
    expect(planSequenceSends([cand({ lastVisit: '2025-12-01' })], o)[0]).toMatchObject({
      kind: 'october_return',
      period: '2026',
    })
    expect(planSequenceSends([cand({ lastVisit: '2025-12-01', resident: true })], o)).toEqual([])
    expect(planSequenceSends([cand()], o)).toEqual([])
    expect(activeCampaigns('2026-11-15')).toEqual([])
  })

  it('green season: residents or visited, May to September', () => {
    const o = { today: '2026-07-10', sent, lastCampaign: new Map<string, string>(), ...ON }
    expect(planSequenceSends([cand({ resident: true })], o)[0]?.kind).toBe('green_season')
    expect(planSequenceSends([cand({ lastVisit: '2026-01-01' })], o)[0]?.kind).toBe('green_season')
    expect(planSequenceSends([cand()], o)).toEqual([])
  })

  it('caps campaigns at one per 30 days per contact, but not J+2/J+3', () => {
    const lastCampaign = new Map([['a@x.com', '2026-10-05']])
    const o = { today: '2026-10-20', sent, lastCampaign, ...ON }
    const out = planSequenceSends([cand({ lastVisit: '2026-10-18' })], o)
    expect(out.map((p) => p.kind)).toEqual(['after_visit_j2'])
    const freed = planSequenceSends([cand({ lastVisit: '2025-11-01' })], {
      ...o,
      lastCampaign: new Map([['a@x.com', '2026-09-10']]),
    })
    expect(freed.map((p) => p.kind)).toEqual(['october_return'])
  })

  it('does not resend a campaign already sent this year', () => {
    const done = new Set([sendKey('a@x.com', 'october_return', '2026')])
    const out = planSequenceSends([cand({ lastVisit: '2025-11-01' })], {
      today: '2026-10-29',
      sent: done,
      lastCampaign: new Map(),
      ...ON,
    })
    expect(out).toEqual([])
  })

  it('is off unless enabled', () => {
    const out = planSequenceSends([cand({ lastVisit: '2025-11-01' })], {
      today: '2026-10-29',
      sent,
      lastCampaign: new Map(),
      sequencesEnabled: true,
      campaignsEnabled: false,
    })
    expect(out).toEqual([])
  })
})

describe('email templates carry image bands, never text only', () => {
  const unsub = 'https://geckocabanerestaurant.com/fr/newsletter/unsubscribe?r=1&s=abc'
  const kinds: SequenceKind[] = ['after_visit_j2', 'during_stay_j3', 'october_return', 'green_season']

  const all = [
    ...kinds.flatMap((k) => (['fr', 'en'] as const).map((l) => [`${k}-${l}`, sequenceEmail(k, l, unsub)] as const)),
    ['welcome-fr', newsletterWelcomeEmail('fr', { guide: 'https://g/x.pdf', recipe: null, unsubscribe: unsub })] as const,
    ['welcome-en', newsletterWelcomeEmail('en', { guide: 'https://g/x.pdf', recipe: 'https://g/r.pdf', unsubscribe: unsub })] as const,
    ['confirm-fr', newsletterConfirmEmail('fr', { confirm: 'https://c', unsubscribe: unsub })] as const,
    ['confirm-en', newsletterConfirmEmail('en', { confirm: 'https://c', unsubscribe: unsub })] as const,
    ['legacy-fr', newsletterLegacyConfirmEmail('fr', { confirm: 'https://c', unsubscribe: unsub })] as const,
    ['legacy-en', newsletterLegacyConfirmEmail('en', { confirm: 'https://c', unsubscribe: unsub })] as const,
  ]

  it.each(all)('%s: header band, divider, absolute hosted URLs, alt text, unsubscribe', (_name, mail) => {
    const imgs = [...mail.html.matchAll(/<img [^>]*>/g)].map((m) => m[0])
    expect(imgs.length).toBeGreaterThanOrEqual(2)
    for (const img of imgs) {
      expect(img).toMatch(/src="https:\/\/geckocabanerestaurant\.com\/email\/band-[a-z]+\.(jpg|png)"/)
      expect(img).toMatch(/alt="[^"]*"/)
    }
    // photo bands have a real alt text; only the decorative divider may be empty
    for (const img of imgs.filter((i) => !i.includes('band-divider'))) expect(img).not.toContain('alt=""')
    expect(mail.html).toContain('band-header.jpg')
    expect(mail.html).toContain('Gecko Cabane') // text fallback when images are blocked
    expect(mail.html).toContain(unsub.replace(/&/g, '&amp;'))
    expect(mail.text).toContain(unsub)
    expect(mail.subject.length).toBeGreaterThan(5)
  })

  it('band files exist and are light', () => {
    for (const file of Object.values(EMAIL_BANDS)) {
      const p = join(root, 'public', file)
      expect(existsSync(p), file).toBe(true)
      expect(readFileSync(p).length, file).toBeLessThan(60 * 1024)
    }
  })

  it('texts match the owner-approved drafts (no DE/SV branch)', () => {
    const j2 = sequenceEmail('after_visit_j2', 'fr', unsub)
    expect(j2.subject).toBe("Merci d'être passés chez Gecko Cabane")
    expect(j2.text).toContain('Si vous avez aimé votre soirée')
    expect(j2.html).toContain('https://geckocabanerestaurant.com/fr/review?src=newsletter')
    expect(sequenceEmail('during_stay_j3', 'en', unsub).subject).toBe('Your stay in Krabi, and a table with us')
    expect(sequenceEmail('october_return', 'en', unsub).subject).toBe('Krabi is getting ready for the season, and so are we')
    expect(sequenceEmail('green_season', 'fr', unsub).subject).toBe('La saison verte à Krabi, une table calme chez Gecko Cabane')
  })
})
