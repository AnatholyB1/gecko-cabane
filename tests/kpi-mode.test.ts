import { describe, it, expect } from 'vitest'
import { resolveReportMode, reportRecipients, reportSubject } from '../src/utils/kpi-mode'

describe('resolveReportMode', () => {
  it('est test par defaut et pour toute valeur inexacte', () => {
    for (const v of [undefined, '', 'LIVE', 'prod', 'true', 'live2']) {
      expect(resolveReportMode(v)).toBe('test')
    }
  })
  it('live seulement pour la valeur exacte (espaces tolérés)', () => {
    expect(resolveReportMode('live')).toBe('live')
    expect(resolveReportMode(' live ')).toBe('live')
  })
})

describe('reportRecipients', () => {
  it('test: uniquement le proprietaire', () => {
    expect(reportRecipients('test', 'o@x.com', 'a@x.com,b@x.com')).toEqual(['o@x.com'])
  })
  it('live: proprietaire + adresses valides dedupliquees', () => {
    expect(reportRecipients('live', 'o@x.com', 'a@x.com, bad, o@x.com')).toEqual(['o@x.com', 'a@x.com'])
  })
  it('proprietaire absent => aucun destinataire', () => {
    expect(reportRecipients('live', undefined, 'a@x.com')).toEqual([])
    expect(reportRecipients('test', undefined, undefined)).toEqual([])
    expect(reportRecipients('test', '  ', undefined)).toEqual([])
  })
  it('10 adresses maximum', () => {
    const extra = Array.from({ length: 12 }, (_, i) => `u${i}@x.com`).join(',')
    expect(reportRecipients('live', 'o@x.com', extra)).toHaveLength(10)
  })
  it('rejette les adresses a deux @ ou avec espace', () => {
    expect(reportRecipients('live', 'o@x.com', 'a@@x.com,a b@x.com,@x.com,a@')).toEqual(['o@x.com'])
  })
})

describe('reportSubject', () => {
  const week = { start: '2026-10-26', end: '2026-11-01' }
  it('test: prefixe [TEST], une ligne', () => {
    const s = reportSubject('test', week)
    expect(s.startsWith('[TEST] ')).toBe(true)
    expect(s).not.toMatch(/[\r\n]/)
  })
  it('live: sans [TEST]', () => {
    expect(reportSubject('live', week)).not.toContain('[TEST]')
  })
})
