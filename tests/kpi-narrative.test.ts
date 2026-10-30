import { describe, it, expect, vi } from 'vitest'
import {
  NARRATIVE_INPUT_KEYS,
  buildNarrativeInput,
  buildPrompt,
  parseNarrative,
  fallbackNarrative,
  generateNarrative,
} from '../src/utils/kpi-narrative'
import { compareWeeks, detectAlerts } from '../src/utils/kpi-alerts'
import type { WeeklyKpiRow } from '../src/types/database'

const PII = 'Client M. Dupont 0812345678'

function row(over: Partial<WeeklyKpiRow> = {}): WeeklyKpiRow {
  return {
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    reservations_new: 6,
    covers: 20,
    no_show: 3,
    no_show_rate: 0.2,
    gsc_clicks: null,
    gsc_partial: true,
    review_clicks_week: { google: 4, tripadvisor: 1 },
    sources_status: { tripadvisor: 'unavailable' },
    alerts: [],
    narrative: null,
    report_sent_at: '2026-10-26T01:00:00Z',
    manual_note: PII,
    ...over,
  } as unknown as WeeklyKpiRow
}

function setup(prev: WeeklyKpiRow | null = row({ reservations_new: 10 })) {
  const cur = row()
  const cmp = compareWeeks(cur, prev)
  const alerts = detectAlerts(cur, prev)
  return { cur, cmp, alerts }
}

const valid = {
  lecture: ['a1', 'a2', 'a3'],
  actions: ['b1', 'b2', 'b3'],
}

function okFetch(text: string, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status }),
  ) as unknown as typeof fetch
}

describe('buildNarrativeInput', () => {
  it('cles en liste blanche, sans PII ni champs exclus', () => {
    const { cur, cmp, alerts } = setup()
    const input = buildNarrativeInput(cur, cmp, alerts)
    for (const k of Object.keys(input)) expect(NARRATIVE_INPUT_KEYS as readonly string[]).toContain(k)
    for (const banned of ['manual_note', 'report_sent_at', 'narrative']) {
      expect(NARRATIVE_INPUT_KEYS as readonly string[]).not.toContain(banned)
      expect(Object.keys(input)).not.toContain(banned)
    }
    const json = JSON.stringify(input)
    expect(json).not.toContain('Dupont')
    expect(json).not.toContain('0812345678')
  })
})

describe('buildPrompt', () => {
  it('system francais JSON 3+3, user = JSON de l entree', () => {
    const { cur, cmp, alerts } = setup()
    const input = buildNarrativeInput(cur, cmp, alerts)
    const p = buildPrompt(input)
    expect(p.system).toMatch(/lecture/)
    expect(p.system).toMatch(/actions/)
    expect(p.system).toMatch(/non disponible/)
    expect(JSON.parse(p.user)).toEqual(JSON.parse(JSON.stringify(input)))
  })
})

describe('parseNarrative', () => {
  it('JSON valide', () => {
    expect(parseNarrative(JSON.stringify(valid))).toEqual({ ...valid, source: 'ai' })
  })
  it('JSON entoure de texte ou de fence', () => {
    expect(parseNarrative('Voici:\n```json\n' + JSON.stringify(valid) + '\n```')?.source).toBe('ai')
    expect(parseNarrative('blabla ' + JSON.stringify(valid) + ' fin')?.source).toBe('ai')
  })
  it('2 elements => null', () => {
    expect(parseNarrative(JSON.stringify({ lecture: ['a', 'b'], actions: valid.actions }))).toBeNull()
  })
  it('chaine trop longue => null', () => {
    expect(parseNarrative(JSON.stringify({ lecture: ['x'.repeat(301), 'b', 'c'], actions: valid.actions }))).toBeNull()
  })
  it('balises HTML retirees', () => {
    const r = parseNarrative(JSON.stringify({ lecture: ['<b>gras</b>', 'b', 'c'], actions: valid.actions }))
    expect(r?.lecture[0]).toBe('gras')
  })
  it('texte non JSON => null', () => {
    expect(parseNarrative('rien du tout')).toBeNull()
  })
})

describe('fallbackNarrative', () => {
  it('3+3, deterministe, cite les alertes', () => {
    const { cmp, alerts } = setup()
    const a = fallbackNarrative(cmp, alerts)
    const b = fallbackNarrative(cmp, alerts)
    expect(a).toEqual(b)
    expect(a.source).toBe('fallback')
    expect(a.lecture).toHaveLength(3)
    expect(a.actions).toHaveLength(3)
    expect(alerts.length).toBeGreaterThan(0)
    expect(a.actions.join(' ') + a.lecture.join(' ')).toMatch(/réservations|no-show/i)
  })
  it('premiere semaine et aucune alerte : toujours 3+3', () => {
    const cur = row()
    const a = fallbackNarrative(compareWeeks(cur, null), [])
    expect(a.lecture).toHaveLength(3)
    expect(a.actions).toHaveLength(3)
    expect(a.lecture.join(' ')).toMatch(/première|1re|reference|référence/i)
  })
})

describe('generateNarrative', () => {
  const { cur, cmp, alerts } = setup()
  const input = buildNarrativeInput(cur, cmp, alerts)

  it('sans cle ou sans modele : repli, aucun fetch', async () => {
    const f = okFetch(JSON.stringify(valid))
    expect((await generateNarrative(input, { model: 'm', fetchImpl: f })).source).toBe('fallback')
    expect((await generateNarrative(input, { apiKey: 'k', fetchImpl: f })).source).toBe('fallback')
    expect(f).not.toHaveBeenCalled()
  })

  it('appel POST conforme et reponse valide => ai', async () => {
    const f = okFetch(JSON.stringify(valid))
    const r = await generateNarrative(input, { apiKey: 'k', model: 'test-model', fetchImpl: f })
    expect(r.source).toBe('ai')
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.method).toBe('POST')
    const h = init.headers as Record<string, string>
    expect(h['x-api-key']).toBe('k')
    expect(h['anthropic-version']).toBe('2023-06-01')
    expect(h['content-type']).toBe('application/json')
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('test-model')
    expect(body.max_tokens).toBe(800)
    expect(typeof body.system).toBe('string')
    expect(body.messages).toEqual([{ role: 'user', content: expect.any(String) }])
    expect(init.body as string).not.toContain('Dupont')
  })

  it('HTTP 500, 429, JSON invalide, fetch rejete => repli', async () => {
    for (const f of [
      okFetch('{}', 500),
      okFetch('{}', 429),
      okFetch('pas du json'),
      vi.fn(async () => {
        throw new Error('timeout')
      }) as unknown as typeof fetch,
    ]) {
      const r = await generateNarrative(input, { apiKey: 'k', model: 'm', fetchImpl: f })
      expect(r.source).toBe('fallback')
      expect(r.lecture).toHaveLength(3)
    }
  })
})
