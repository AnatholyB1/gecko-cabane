/**
 * Brevo v3 client (NEWS-01, NEWS-07). Server-only: reads BREVO_API_KEY.
 * Never throws; failures are reported to Sentry with status and path only
 * (never the email or the key) and surfaced as { ok: false }.
 */

import * as Sentry from '@sentry/nextjs'
import type { SubscriberProfile } from './newsletter-segments'

export const BREVO_API_BASE = 'https://api.brevo.com/v3'

export interface BrevoResult {
  ok: boolean
  status?: number
  skipped?: boolean
}

export function getBrevoConfig(): { apiKey: string; listId: number } | null {
  const apiKey = process.env.BREVO_API_KEY
  const raw = process.env.BREVO_LIST_ID
  if (!apiKey || !raw || !/^[0-9]+$/.test(raw)) return null
  const listId = Number(raw)
  if (!Number.isSafeInteger(listId) || listId <= 0) return null
  return { apiKey, listId }
}

export function buildContactAttributes(p: SubscriberProfile): Record<string, string | boolean> {
  const attrs: Record<string, string | boolean> = {
    LANGUAGE: p.language,
    COUNTRY: p.country ?? '',
    RESIDENT: p.resident,
    SOURCE: p.source,
    CONSENT_AT: p.consentAt.slice(0, 10),
  }
  if (p.lastVisit) attrs.LAST_VISIT_DATE = p.lastVisit
  return attrs
}

export function buildUpsertBody(p: SubscriberProfile, listId: number) {
  return {
    email: p.email,
    attributes: buildContactAttributes(p),
    listIds: [listId],
    updateEnabled: true,
    emailBlacklisted: false,
  }
}

async function call(
  apiKey: string,
  method: 'POST' | 'PUT',
  path: string,
  body: unknown
): Promise<BrevoResult> {
  try {
    const res = await fetch(`${BREVO_API_BASE}${path}`, {
      method,
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      Sentry.captureMessage(`Brevo ${method} ${path.replace(/\/[^/]*%40[^/]*/, '/:email')} failed: ${res.status}`, 'warning')
      return { ok: false, status: res.status }
    }
    return { ok: true, status: res.status }
  } catch {
    Sentry.captureMessage(`Brevo ${method} request failed (network or timeout)`, 'warning')
    return { ok: false }
  }
}

function withConfig(): { apiKey: string; listId: number } | null {
  const cfg = getBrevoConfig()
  if (!cfg) Sentry.captureMessage('BREVO_API_KEY or BREVO_LIST_ID is not set: Brevo call skipped', 'warning')
  return cfg
}

const SKIPPED: BrevoResult = { ok: false, skipped: true }

export async function upsertBrevoContact(profile: SubscriberProfile): Promise<BrevoResult> {
  const cfg = withConfig()
  if (!cfg) return SKIPPED
  return call(cfg.apiKey, 'POST', '/contacts', buildUpsertBody(profile, cfg.listId))
}

/** Attributes only, never listIds: a Brevo-side unsubscribe is never undone by a sync. */
export async function updateBrevoContactAttributes(
  email: string,
  attributes: Record<string, string | boolean>
): Promise<BrevoResult> {
  const cfg = withConfig()
  if (!cfg) return SKIPPED
  return call(cfg.apiKey, 'PUT', `/contacts/${encodeURIComponent(email)}`, { attributes })
}

export async function blacklistBrevoContact(email: string): Promise<BrevoResult> {
  const cfg = withConfig()
  if (!cfg) return SKIPPED
  return call(cfg.apiKey, 'PUT', `/contacts/${encodeURIComponent(email)}`, {
    emailBlacklisted: true,
    unlinkListIds: [cfg.listId],
  })
}

export async function addToBrevoList(listId: number, emails: string[]): Promise<BrevoResult> {
  const cfg = withConfig()
  if (!cfg) return SKIPPED
  return call(cfg.apiKey, 'POST', `/contacts/lists/${listId}/contacts/add`, { emails })
}

export async function removeFromBrevoList(listId: number, emails: string[]): Promise<BrevoResult> {
  const cfg = withConfig()
  if (!cfg) return SKIPPED
  return call(cfg.apiKey, 'POST', `/contacts/lists/${listId}/contacts/remove`, { emails })
}
