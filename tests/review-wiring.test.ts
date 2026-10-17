/**
 * Source-scan of the review-invitation cron wiring (plan 04-05).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const ROUTE = 'src/app/api/cron/review-invitations/route.ts'

describe('vercel.json', () => {
  it('declares exactly one daily cron at 0 4 * * *', () => {
    const v = JSON.parse(read('vercel.json'))
    expect(v.crons).toEqual([
      { path: '/api/cron/review-invitations', schedule: '0 4 * * *' },
    ])
  })
})

describe('review-invitations cron route', () => {
  const src = read(ROUTE)

  it('is secured by a fail-closed Bearer secret', () => {
    expect(src).toContain('process.env.CRON_SECRET')
    expect(src).toContain('`Bearer ${')
    expect(src).toContain('status: 401')
    expect(src).toContain("export const dynamic = 'force-dynamic'")
    expect(src).toContain('export const maxDuration')
  })

  it('does no work before auth', () => {
    const auth = src.indexOf('status: 401')
    expect(auth).toBeGreaterThan(-1)
    expect(auth).toBeLessThan(src.indexOf('createAdminClient('))
    expect(auth).toBeLessThan(src.indexOf('getResendClient('))
  })

  it('claims atomically with conditional updates re-checking status', () => {
    expect(src).toContain(".is('review_email_sent_at', null)")
    expect(src).toContain(".is('review_reminder_sent_at', null)")
    expect(src).toContain(".is('review_clicked_at', null)")
    expect(src).toContain(".in('status'")
  })

  it('claims before sending', () => {
    const claim = src.indexOf('.update(')
    const send = src.indexOf('emails.send(')
    expect(claim).toBeGreaterThan(-1)
    expect(send).toBeGreaterThan(claim)
  })

  it('uses Resend idempotency keys and releases claims on failure', () => {
    expect(src).toContain('idempotencyKey')
    expect(src).toContain('review-invite-')
    expect(src).toContain('review-reminder-')
    expect(src).toMatch(/review_email_sent_at: null/)
    expect(src).toMatch(/review_reminder_sent_at: null/)
  })

  it('uses the pure selection helpers and supports dry run', () => {
    expect(src).toContain('selectReviewInvitations(')
    expect(src).toContain('krabiToday(')
    expect(src).toContain('emailLocaleFor(')
    expect(src).toContain('buildEmailReviewUrl(')
    expect(src).toContain("searchParams.get('dry')")
  })

  it('leaks no PII in responses or logs and never redirects', () => {
    const spans = src.match(/NextResponse\.json(?:<[^(]*>)?\([\s\S]*?\)\s*\n/g) ?? []
    expect(spans.length).toBeGreaterThan(0)
    for (const s of spans) {
      expect(s).not.toMatch(/customer_email|customer_name|review_token/)
    }
    expect(src).not.toContain('console.log(')
    expect(src).not.toContain('NextResponse.redirect')
  })
})
