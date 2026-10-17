/**
 * Guards the newsletter sequence drafts and the Brevo runbook (07-07).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', 'docs', 'newsletter')
const SEQ_DIR = join(ROOT, 'sequences')

const DRAFTS = [
  'after-visit-j2',
  'during-stay-j3',
  'october-return',
  'green-season',
].flatMap((n) => [`${n}-fr.md`, `${n}-en.md`])

const read = (p: string) => readFileSync(p, 'utf8')

describe('newsletter docs', () => {
  it('all files exist', () => {
    expect(existsSync(join(ROOT, 'SEQUENCES.md'))).toBe(true)
    expect(existsSync(join(ROOT, 'BREVO-SETUP.md'))).toBe(true)
    for (const f of DRAFTS) expect(existsSync(join(SEQ_DIR, f)), f).toBe(true)
  })

  it('SEQUENCES.md covers J+2 and J+3', () => {
    const s = read(join(ROOT, 'SEQUENCES.md'))
    expect(s).toContain('J+2')
    expect(s).toContain('J+3')
  })

  it('drafts contain no exclamation mark outside image syntax', () => {
    for (const f of DRAFTS) {
      const body = read(join(SEQ_DIR, f)).replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      expect(body.includes('!'), f).toBe(false)
    }
  })

  it('every draft has the unsubscribe tag', () => {
    for (const f of DRAFTS) expect(read(join(SEQ_DIR, f)), f).toContain('{{ unsubscribe }}')
  })

  it('BREVO-SETUP.md names attributes, webhook and the monthly cap', () => {
    const s = read(join(ROOT, 'BREVO-SETUP.md'))
    for (const a of ['LANGUAGE', 'COUNTRY', 'RESIDENT', 'SOURCE', 'CONSENT_AT', 'LAST_VISIT_DATE']) {
      expect(s, a).toContain(a)
    }
    expect(s).toContain('api/webhooks/brevo')
    expect(s).toContain('1 email par mois')
  })

  it('has no DE or SV drafts', () => {
    const names = [...readdirSync(SEQ_DIR), ...readdirSync(ROOT)]
    expect(names.filter((n) => /-(de|sv)(\.|$)/.test(n))).toEqual([])
  })
})
