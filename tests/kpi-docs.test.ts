/**
 * KPI documentation guards (Phase 8, plan 04, KPI-02 / KPI-05 / KPI-08).
 * Traceability must follow D-01 (in-app cron), D-03 (no automatic GBP), D-04 (email only).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf-8')
const lines = (p: string) => read(p).split(/\r?\n/)

describe('KPI traceability (D-01, D-03, D-04, D-09)', () => {
  it('KPI-02 is an in-app cron, without the old external orchestrator', () => {
    const line = lines('.planning/REQUIREMENTS.md').find((l) => l.includes('**KPI-02**')) ?? ''
    expect(line).not.toBe('')
    expect(line.toLowerCase()).not.toContain('n8n')
    expect(line).toContain('cron')
    expect(line).toContain('gecko_weekly_kpis')
    expect(line).toContain('ancien workflow externe')
  })

  it('KPI-05 is email only', () => {
    const line = lines('.planning/REQUIREMENTS.md').find((l) => l.includes('**KPI-05**')) ?? ''
    expect(line).not.toBe('')
    expect(line).not.toContain('et résumé WhatsApp')
  })

  it('KPI-08 states the TEST mode constraint', () => {
    const line = lines('.planning/REQUIREMENTS.md').find((l) => l.includes('**KPI-08**')) ?? ''
    expect(line).toContain('mode TEST')
  })

  it('ROADMAP phase 8 success criteria carry no n8n nor Google Business Profile', () => {
    const roadmap = read('.planning/ROADMAP.md')
    const start = roadmap.indexOf('### Phase 8: Reporting KPI hebdomadaire')
    expect(start).toBeGreaterThan(-1)
    const section = roadmap.slice(start)
    const a = section.indexOf('**Success Criteria**')
    const b = section.indexOf('**Plans**')
    expect(a).toBeGreaterThan(-1)
    expect(b).toBeGreaterThan(a)
    const block = section.slice(a, b)
    expect(block.toLowerCase()).not.toContain('n8n')
    expect(block).not.toContain('Google Business Profile')
    const listLine = lines('.planning/ROADMAP.md').find((l) => l.startsWith('- [ ] **Phase 8:')) ?? ''
    expect(listLine).not.toBe('')
    expect(listLine.toLowerCase()).not.toContain('n8n')
  })

  it('PROJECT no longer says n8n collection', () => {
    expect(read('.planning/PROJECT.md')).not.toContain('collecte n8n')
  })
})
