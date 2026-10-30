/**
 * Mode d'envoi du rapport KPI hebdomadaire (phase 8, D-09).
 * Fail-safe : tout ce qui n'est pas exactement « live » est le mode TEST,
 * qui n'écrit qu'au propriétaire.
 */

import type { KpiReportMode } from '@/types/database'
import { stripLineBreaks } from '@/utils/html'

const MAX_RECIPIENTS = 10

export function resolveReportMode(raw: string | undefined): KpiReportMode {
  return raw?.trim() === 'live' ? 'live' : 'test'
}

function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 254) return false
  if (/\s/.test(value)) return false
  const parts = value.split('@')
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0
}

export function reportRecipients(
  mode: KpiReportMode,
  owner: string | undefined,
  extra: string | undefined
): string[] {
  const ownerTrimmed = owner?.trim() ?? ''
  if (!ownerTrimmed) return []
  if (mode !== 'live') return [ownerTrimmed]

  const out: string[] = [ownerTrimmed]
  const seen = new Set<string>([ownerTrimmed.toLowerCase()])
  for (const candidate of (extra ?? '').split(',')) {
    const email = candidate.trim()
    if (!isValidEmail(email)) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(email)
    if (out.length >= MAX_RECIPIENTS) break
  }
  return out
}

export function reportSubject(mode: KpiReportMode, week: { start: string; end: string }): string {
  const base = `Gecko Cabane - rapport KPI du ${week.start} au ${week.end}`
  return stripLineBreaks(mode === 'live' ? base : `[TEST] ${base}`)
}
