import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import { resolveActiveSubscribers, type LedgerRow } from '@/utils/newsletter-ledger'
import {
  latestHonoredByEmail,
  profileWithReservation,
  selectSyncUpdates,
  selectSequenceListAdds,
  type SyncReservation,
  type SubscriberProfile,
} from '@/utils/newsletter-segments'
import {
  getBrevoConfig,
  upsertBrevoContact,
  updateBrevoContactAttributes,
  addToBrevoList,
  removeFromBrevoList,
} from '@/utils/brevo'
import { REVIEW_ELIGIBLE_STATUSES, krabiToday } from '@/utils/review-invitations'
import type { ApiResponse } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type SyncCounts = {
  today: string
  retry: number
  updates: number
  afterVisit: number
  duringStay: number
  dryRun?: boolean
  synced?: number
  failed?: number
  skipped?: number
}

const BREVO_PAUSE_MS = 150
const BREVO_CALL_BUDGET = 200
const CHUNK = 100
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function listIdFromEnv(name: string): number | null {
  const raw = process.env[name]
  if (!raw || !/^[0-9]+$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

// Daily push of visit date, country and resident flag to Brevo (D-05, D-14, D-15).
// Attributes only: Brevo automations trigger from data, the app never schedules sends.
export async function GET(request: NextRequest) {
  // Fail closed: no secret configured or wrong header -> 401, before any work.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry') === '1'

  try {
    // Service role justified: the consent ledger and reservations hold PII with no
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

    // Retry confirmed subscribers whose Brevo push failed at confirmation.
    const latest = latestHonoredByEmail(reservations, today)
    const retryRows = [...actives.values()].filter((r) => r.brevo_synced_at === null)
    const syncedActives = new Map(
      [...actives].filter(([, r]) => r.brevo_synced_at !== null)
    )
    const updates = selectSyncUpdates(syncedActives, reservations, today)

    const afterVisitList = listIdFromEnv('BREVO_LIST_AFTER_VISIT')
    const duringStayList = listIdFromEnv('BREVO_LIST_DURING_STAY')
    const profiles: SubscriberProfile[] = [...actives.values()].map((r) =>
      profileWithReservation(r, latest)
    )
    const adds = selectSequenceListAdds(profiles, today)
    const afterVisit = afterVisitList ? adds.afterVisit : []
    const duringStay = duringStayList ? adds.duringStay : []

    if (dryRun) {
      return NextResponse.json<ApiResponse<SyncCounts>>({
        data: {
          today,
          retry: retryRows.length,
          updates: updates.length,
          afterVisit: afterVisit.length,
          duringStay: duringStay.length,
          dryRun: true,
        },
      })
    }

    if (!getBrevoConfig()) {
      Sentry.captureMessage('BREVO_API_KEY or BREVO_LIST_ID is not set: newsletter sync skipped', 'warning')
      return NextResponse.json<ApiResponse<SyncCounts>>({
        data: {
          today,
          retry: retryRows.length,
          updates: updates.length,
          afterVisit: afterVisit.length,
          duringStay: duringStay.length,
          skipped: retryRows.length + updates.length + afterVisit.length + duringStay.length,
        },
      })
    }

    let budget = BREVO_CALL_BUDGET
    let synced = 0
    let failed = 0
    let skipped = 0

    const persist = async (rowId: number, profile: SubscriberProfile, markSynced: boolean) => {
      const { error } = await admin
        .from('gecko_marketing_consents')
        .update({
          ...(markSynced ? { brevo_synced_at: new Date().toISOString() } : {}),
          country: profile.country,
          is_resident: profile.resident,
          last_visit_synced: profile.lastVisit,
        })
        .eq('id', rowId)
      if (error) Sentry.captureException(error)
    }

    for (const row of retryRows) {
      if (budget <= 0) {
        skipped++
        continue
      }
      budget--
      const profile = profileWithReservation(row, latest)
      const res = await upsertBrevoContact(profile)
      if (res.ok) {
        await persist(row.id, profile, true)
        synced++
      } else {
        failed++
      }
      await sleep(BREVO_PAUSE_MS)
    }

    for (const { row, profile } of updates) {
      if (budget <= 0) {
        skipped++
        continue
      }
      budget--
      const attributes: Record<string, string | boolean> = {
        COUNTRY: profile.country ?? '',
        RESIDENT: profile.resident,
      }
      if (profile.lastVisit) attributes.LAST_VISIT_DATE = profile.lastVisit
      const res = await updateBrevoContactAttributes(row.email, attributes)
      if (res.ok) {
        await persist(row.id, profile, false)
        synced++
      } else {
        failed++
      }
      await sleep(BREVO_PAUSE_MS)
    }

    // Remove then add so a returning guest re-enters the automation trigger.
    const listJobs: { listId: number | null; list: string[] }[] = [
      { listId: afterVisitList, list: afterVisit },
      { listId: duringStayList, list: duringStay },
    ]
    for (const { listId, list } of listJobs) {
      if (!listId || list.length === 0) continue
      if (budget < 2) {
        skipped += list.length
        continue
      }
      budget -= 2
      const removed = await removeFromBrevoList(listId, list)
      await sleep(BREVO_PAUSE_MS)
      const added = await addToBrevoList(listId, list)
      await sleep(BREVO_PAUSE_MS)
      if (removed.ok && added.ok) synced += list.length
      else failed += list.length
    }

    return NextResponse.json<ApiResponse<SyncCounts>>({
      data: {
        today,
        retry: retryRows.length,
        updates: updates.length,
        afterVisit: afterVisit.length,
        duringStay: duringStay.length,
        synced,
        failed,
        skipped,
      },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json<ApiResponse<SyncCounts>>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
