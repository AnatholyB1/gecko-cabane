/**
 * Newsletter sequence selection (NEWS-06; D-05, D-07, D-08, D-09). Pure module.
 *
 * The app now sends the sequences itself through Resend (owner decision 2026-10-29),
 * so the cap of 1 campaign email per month (D-08) is enforced here, in code, and every
 * send is claimed in gecko_newsletter_sends so a contact never gets the same email twice.
 *
 * - J+2 after the visit and J+3 for tourists: short catch-up windows, deduped by visit date.
 * - High-season return (kind october_return, November; tourists with a visit) and green season (residents or visited):
 *   seasonal campaigns, once per year, at most one campaign per 30 days per contact.
 */

import { addDays } from './review-invitations'
import { CAMPAIGN_KINDS, type SequenceKind } from './newsletter-emails'

export interface SequenceCandidate {
  email: string
  rowId: number
  language: string
  lastVisit: string | null
  resident: boolean
}

export interface PlannedSend {
  kind: SequenceKind
  email: string
  rowId: number
  language: string
  /** Dedup period: visit date for J+2/J+3, year for campaigns. */
  period: string
}

export const CAMPAIGN_CAP_DAYS = 30

/** J+2 window: visit 2 to 4 days ago. J+3 window: 3 to 5 days ago. */
const WINDOWS = { after_visit_j2: [2, 4], during_stay_j3: [3, 5] } as const

export function sendKey(email: string, kind: string, period: string): string {
  return `${email.toLowerCase()}|${kind}|${period}`
}

function monthOf(today: string): number {
  return Number(today.slice(5, 7))
}

/**
 * Seasonal windows (Krabi calendar): green season May to September; the high-season
 * campaign in November (1 to 30). The kind keeps its historical name `october_return`
 * (it was planned for October; the SQL check constraint of migration 017 lists that
 * name, so it is not renamed). Once per contact per year (period = year), capped with
 * the 30-day campaign rule.
 */
export function activeCampaigns(today: string): SequenceKind[] {
  const m = monthOf(today)
  if (m === 11) return ['october_return']
  if (m >= 5 && m <= 9) return ['green_season']
  return []
}

export interface PlanOptions {
  today: string
  /** keys already sent (sendKey). */
  sent: Set<string>
  /** latest campaign send date (YYYY-MM-DD) per lower-cased email. */
  lastCampaign: Map<string, string>
  sequencesEnabled: boolean
  campaignsEnabled: boolean
}

export function planSequenceSends(
  candidates: SequenceCandidate[],
  o: PlanOptions
): PlannedSend[] {
  const out: PlannedSend[] = []
  const capStart = addDays(o.today, -CAMPAIGN_CAP_DAYS)
  const year = o.today.slice(0, 4)

  for (const c of candidates) {
    const email = c.email.toLowerCase()
    const add = (kind: SequenceKind, period: string) => {
      if (o.sent.has(sendKey(email, kind, period))) return
      out.push({ kind, email: c.email, rowId: c.rowId, language: c.language, period })
    }

    if (o.sequencesEnabled && c.lastVisit) {
      const age = (kind: keyof typeof WINDOWS) => {
        const [min, max] = WINDOWS[kind]
        return c.lastVisit! <= addDays(o.today, -min) && c.lastVisit! >= addDays(o.today, -max)
      }
      if (age('after_visit_j2')) add('after_visit_j2', c.lastVisit)
      if (!c.resident && age('during_stay_j3')) add('during_stay_j3', c.lastVisit)
    }

    if (o.campaignsEnabled) {
      const last = o.lastCampaign.get(email)
      const capped = last !== undefined && last > capStart
      if (!capped) {
        for (const kind of activeCampaigns(o.today)) {
          const eligible =
            kind === 'october_return' ? !c.resident && c.lastVisit !== null : c.resident || c.lastVisit !== null
          if (eligible) {
            add(kind, year)
            break // one campaign per run per contact
          }
        }
      }
    }
  }
  return out
}

export function isCampaign(kind: SequenceKind): boolean {
  return CAMPAIGN_KINDS.includes(kind)
}
