import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { resolveActiveSubscribers, type LedgerRow } from '@/utils/newsletter-ledger'
import {
  latestHonoredByEmail,
  profileWithReservation,
  selectSyncUpdates,
  type SyncReservation,
  type SubscriberProfile,
} from '@/utils/newsletter-segments'
import { planSequenceSends, sendKey, isCampaign } from '@/utils/newsletter-sequences'
import { sequenceEmail, type SequenceKind } from '@/utils/newsletter-emails'
import { buildUnsubscribeUrl, buildOneClickUnsubscribeUrl, toPageLocale } from '@/utils/newsletter-links'
import { upsertResendContact, updateResendContactProperties } from '@/utils/resend-contacts'
import { getResendClient, RESEND_FROM_EMAIL } from '@/utils/resend'
import { REVIEW_ELIGIBLE_STATUSES, krabiToday, addDays } from '@/utils/review-invitations'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type SyncCounts = {
  today: string
  retry: number
  updates: number
  planned: number
  dryRun?: boolean
  sendsEnabled?: boolean
  campaignsEnabled?: boolean
  synced?: number
  sent?: number
  failed?: number
  skipped?: number
}

const CALL_PAUSE_MS = 600 // Resend default limit is 2 requests per second
const CALL_BUDGET = 80 // one run must finish inside maxDuration
const CHUNK = 100
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Daily job (11:00 UTC = 18:00 Krabi): mirrors segments to Resend contacts and sends the
// J+2 / J+3 sequences and the seasonal campaigns (D-05, D-07, D-08). Sending is OFF unless
// NEWSLETTER_SEQUENCES_ENABLED / NEWSLETTER_CAMPAIGNS_ENABLED are "1": owner-gated.
export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry') === '1'
  const sequencesEnabled = process.env.NEWSLETTER_SEQUENCES_ENABLED === '1'
  const campaignsEnabled = process.env.NEWSLETTER_CAMPAIGNS_ENABLED === '1'
  const secret = process.env.NEWSLETTER_SIGNING_SECRET

  try {
    // Service role justified: the consent ledger, send log and reservations hold PII with no
    // anon policy. This server-only route is gated by CRON_SECRET and returns counts only.
    const admin = createAdminClient()
    const today = krabiToday(new Date())

    const { data: ledger, error: ledgerError } = await admin
      .from('gecko_marketing_consents')
      .select('*')
    if (ledgerError) {
      Sentry.captureException(ledgerError)
      return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Erreur serveur' }, { status: 500 })
    }

    const actives = resolveActiveSubscribers((ledger ?? []) as LedgerRow[])
    const emails = [...new Set([...actives.values()].flatMap((r) => [r.email, r.email.toLowerCase()]))]

    const reservations: SyncReservation[] = []
    for (let i = 0; i < emails.length; i += CHUNK) {
      const { data, error } = await admin
        .from('gecko_reservations')
        .select('customer_email, reservation_date, customer_phone, status')
        .in('customer_email', emails.slice(i, i + CHUNK))
        .in('status', [...REVIEW_ELIGIBLE_STATUSES])
        .lte('reservation_date', today)
      if (error) {
        Sentry.captureException(error)
        return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Erreur serveur' }, { status: 500 })
      }
      reservations.push(...((data ?? []) as SyncReservation[]))
    }

    const latest = latestHonoredByEmail(reservations, today)
    const retryRows = [...actives.values()].filter((r) => r.contact_synced_at === null)
    const syncedActives = new Map([...actives].filter(([, r]) => r.contact_synced_at !== null))
    const updates = selectSyncUpdates(syncedActives, reservations, today)

    // Send log: what was already sent, and the latest campaign per contact (cap, D-08).
    const { data: sendLog, error: sendLogError } = await admin
      .from('gecko_newsletter_sends')
      .select('email, kind, period, sent_at')
      .gte('sent_at', `${addDays(today, -400)}T00:00:00Z`)
    if (sendLogError) {
      Sentry.captureException(sendLogError)
      return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Erreur serveur' }, { status: 500 })
    }
    const sent = new Set<string>()
    const lastCampaign = new Map<string, string>()
    for (const s of (sendLog ?? []) as { email: string; kind: SequenceKind; period: string; sent_at: string }[]) {
      sent.add(sendKey(s.email, s.kind, s.period))
      if (isCampaign(s.kind)) {
        const day = krabiToday(new Date(s.sent_at))
        const prev = lastCampaign.get(s.email.toLowerCase())
        if (!prev || day > prev) lastCampaign.set(s.email.toLowerCase(), day)
      }
    }

    const profiles: { row: LedgerRow; profile: SubscriberProfile }[] = [...actives.values()].map((row) => ({
      row,
      profile: profileWithReservation(row, latest),
    }))
    const planned = planSequenceSends(
      profiles.map(({ row, profile }) => ({
        email: row.email,
        rowId: row.id,
        language: profile.language,
        lastVisit: profile.lastVisit,
        resident: profile.resident,
      })),
      { today, sent, lastCampaign, sequencesEnabled, campaignsEnabled }
    )
    // Sequences before campaigns when the budget is short.
    planned.sort((a, b) => Number(isCampaign(a.kind)) - Number(isCampaign(b.kind)))

    const base: SyncCounts = {
      today,
      retry: retryRows.length,
      updates: updates.length,
      planned: planned.length,
      sendsEnabled: sequencesEnabled,
      campaignsEnabled,
    }
    if (dryRun) {
      return NextResponse.json<ApiResponse<SyncCounts>>({ data: { ...base, dryRun: true } })
    }

    const resend = getResendClient()
    if (!resend) {
      Sentry.captureMessage('RESEND_API_KEY is not set: newsletter sync skipped', 'warning')
      return NextResponse.json<ApiResponse<SyncCounts>>({
        data: { ...base, skipped: retryRows.length + updates.length + planned.length },
      })
    }

    let budget = CALL_BUDGET
    let synced = 0
    let sentCount = 0
    let failed = 0
    let skipped = 0

    const persist = async (rowId: number, profile: SubscriberProfile, markSynced: boolean) => {
      const { error } = await admin
        .from('gecko_marketing_consents')
        .update({
          ...(markSynced ? { contact_synced_at: new Date().toISOString() } : {}),
          country: profile.country,
          is_resident: profile.resident,
          last_visit_synced: profile.lastVisit,
        })
        .eq('id', rowId)
      if (error) Sentry.captureException(error)
    }

    // 1. Sequences first: they are time-boxed.
    if (secret) {
      for (const p of planned) {
        if (budget <= 0) {
          skipped++
          continue
        }
        budget--
        // Claim by insert: the unique key makes a concurrent run skip this send.
        const claim = await admin
          .from('gecko_newsletter_sends')
          .insert({ email: p.email.toLowerCase(), kind: p.kind, period: p.period })
        if (claim.error) {
          // 23505 = already claimed elsewhere; anything else is reported.
          if (claim.error.code !== '23505') Sentry.captureException(claim.error)
          skipped++
          continue
        }
        const locale = toPageLocale(p.language)
        const mail = sequenceEmail(p.kind, locale, buildUnsubscribeUrl(secret, locale, p.rowId))
        let ok = false
        try {
          const { error } = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: p.email,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            headers: {
              'List-Unsubscribe': `<${buildOneClickUnsubscribeUrl(secret, p.rowId)}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          ok = !error
          if (error) Sentry.captureMessage(`Newsletter send failed: ${error.name}`, 'warning')
        } catch (e) {
          Sentry.captureException(e)
        }
        if (ok) {
          sentCount++
        } else {
          failed++
          // Release the claim so the next run retries inside the window.
          const { error } = await admin
            .from('gecko_newsletter_sends')
            .delete()
            .eq('email', p.email.toLowerCase())
            .eq('kind', p.kind)
            .eq('period', p.period)
          if (error) Sentry.captureException(error)
        }
        await sleep(CALL_PAUSE_MS)
      }
    } else if (planned.length > 0) {
      Sentry.captureMessage('NEWSLETTER_SIGNING_SECRET is not set: newsletter sends skipped', 'error')
      skipped += planned.length
    }

    // 2. Contact mirror: retry failed confirmations, then segment changes.
    for (const { row } of profiles.filter(({ row }) => row.contact_synced_at === null)) {
      if (budget <= 0) {
        skipped++
        continue
      }
      budget--
      const profile = profileWithReservation(row, latest)
      const res = await upsertResendContact(profile)
      if (res.ok) {
        await persist(row.id, profile, true)
        synced++
      } else {
        failed++
      }
      await sleep(CALL_PAUSE_MS)
    }
    for (const { row, profile } of updates) {
      if (budget <= 0) {
        skipped++
        continue
      }
      budget--
      const res = await updateResendContactProperties(profile)
      if (res.ok) {
        await persist(row.id, profile, false)
        synced++
      } else {
        failed++
      }
      await sleep(CALL_PAUSE_MS)
    }

    return NextResponse.json<ApiResponse<SyncCounts>>({
      data: { ...base, synced, sent: sentCount, failed, skipped },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

