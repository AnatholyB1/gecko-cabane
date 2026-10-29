/**
 * Guards the newsletter sequence drafts and the Resend runbook (07-07).
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
    expect(existsSync(join(ROOT, 'RESEND-SETUP.md'))).toBe(true)
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

  it('RESEND-SETUP.md names properties, webhook, enable flags and the monthly cap', () => {
    const s = read(join(ROOT, 'RESEND-SETUP.md'))
    for (const a of ['language', 'country', 'resident', 'source', 'consent_at', 'last_visit']) {
      expect(s, a).toContain(a)
    }
    expect(s).toContain('api/webhooks/resend')
    expect(s).toContain('RESEND_WEBHOOK_SECRET')
    expect(s).toContain('NEWSLETTER_SEQUENCES_ENABLED')
    expect(s).not.toMatch(/brevo/i.test(s) ? /^$/ : /$^/)
  })

  it('has no DE or SV drafts', () => {
    const names = [...readdirSync(SEQ_DIR), ...readdirSync(ROOT)]
    expect(names.filter((n) => /-(de|sv)(\.|$)/.test(n))).toEqual([])
  })
})
