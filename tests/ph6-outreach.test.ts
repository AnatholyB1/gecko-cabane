/**
 * Doc tests for the Phase 6 off-site deliverables (OPS-06 outreach, OPS-07 concierge dossier).
 * Nothing is sent: these files only prepare material for the owner (D-18).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const TARGETS = path.join(ROOT, 'docs/ph6/outreach-targets.md')
const MESSAGES = path.join(ROOT, 'docs/ph6/outreach-messages.md')
const DOSSIER = path.join(ROOT, 'docs/ph6/concierge-dossier.md')
const PDF = path.join(ROOT, 'docs/ph6/concierge-dossier.pdf')
const SCRIPT = path.join(ROOT, 'scripts/generate-concierge-dossier.mjs')

const read = (f: string) => fs.readFileSync(f, 'utf8')
const firstLine = (s: string) => s.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

describe('outreach targets', () => {
  it('lists the four targets with unverified routes flagged', () => {
    const s = read(TARGETS)
    expect(firstLine(s).startsWith('Statut : non envoyé')).toBe(true)
    for (const t of ['Petit Futé', 'Travelfish', 'Faszination Südostasien', 'Marco Polo']) {
      expect(s).toContain(t)
    }
    expect(s).toContain('A VÉRIFIER')
    expect(s).toContain('Route de contact')
  })
})

describe('outreach messages', () => {
  it('has 12 messages (4 targets x FR/EN/DE), unsent', () => {
    const s = read(MESSAGES)
    expect(firstLine(s).startsWith('Statut : non envoyé')).toBe(true)
    const re = /^### (Petit Futé|Travelfish|Faszination Südostasien|Marco Polo) — (FR|EN|DE)$/gm
    expect(s.match(re)?.length).toBe(12)
  })
})

describe('outreach privacy and commitments', () => {
  it('contains no e-mail other than the public restaurant one', () => {
    for (const f of [TARGETS, MESSAGES]) {
      const found = read(f).match(EMAIL) ?? []
      for (const e of found) expect(e).toBe('geckocabanerestaurant@gmail.com')
    }
  })

  it('proposes no commission figure or percentage', () => {
    for (const f of [TARGETS, MESSAGES, DOSSIER]) {
      const s = read(f)
      expect(s).not.toMatch(/\b(commission de|commission of)\s*\d/i)
      expect(s).not.toMatch(/\d+\s?%/)
    }
  })
})

describe('concierge dossier', () => {
  it('markdown holds the required sections and placeholder', () => {
    const s = read(DOSSIER)
    for (const k of [
      '[à définir par le propriétaire]',
      'Krabi Town',
      'Ao Nang',
      'Carte de recommandation',
      'https://geckocabanerestaurant.com',
    ]) {
      expect(s).toContain(k)
    }
  })

  it('PDF exists and is valid', () => {
    expect(fs.existsSync(PDF)).toBe(true)
    expect(fs.statSync(PDF).size).toBeGreaterThan(1000)
    expect(fs.readFileSync(PDF).subarray(0, 4).toString('latin1')).toBe('%PDF')
  })

  it('generator is offline and uses only allowed imports', () => {
    const src = read(SCRIPT)
    const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])
    for (const i of imports) expect(['node:fs', 'node:path', 'pdfkit', 'qrcode']).toContain(i)
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('http.request')
  })
})
