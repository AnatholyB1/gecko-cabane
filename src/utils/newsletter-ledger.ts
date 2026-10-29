/**
 * Append-only consent ledger state resolver (D-01, D-15). Pure module.
 *
 * Rows of gecko_marketing_consents are never updated to withdraw: a
 * consent=false row later than a consent is the withdrawal. Ties on
 * consented_at are broken by id.
 */

export interface LedgerRow {
  id: number
  email: string
  consent: boolean
  source: string
  locale: string
  consented_at: string
  confirmed_at: string | null
  confirmation_sent_at: string | null
  country: string | null
  is_resident: boolean
  contact_synced_at: string | null
  last_visit_synced: string | null
  reservation_id: number | null
}

export type EmailStatus = 'none' | 'pending' | 'active' | 'withdrawn'

export interface EmailState {
  status: EmailStatus
  activeRow: LedgerRow | null
  pendingRow: LedgerRow | null
  lastWithdrawalAt: string | null
}

/** Compare by consented_at then id. */
function cmp(a: LedgerRow, b: LedgerRow): number {
  const d = Date.parse(a.consented_at) - Date.parse(b.consented_at)
  return d !== 0 ? d : a.id - b.id
}

function latest(rows: LedgerRow[]): LedgerRow | null {
  return rows.reduce<LedgerRow | null>((best, r) => (best === null || cmp(r, best) > 0 ? r : best), null)
}

export function groupByEmail(rows: LedgerRow[]): Map<string, LedgerRow[]> {
  const map = new Map<string, LedgerRow[]>()
  for (const r of rows) {
    const key = r.email.toLowerCase()
    const list = map.get(key)
    if (list) list.push(r)
    else map.set(key, [r])
  }
  return map
}

export function resolveEmailState(rows: LedgerRow[]): EmailState {
  const withdrawals = rows.filter((r) => !r.consent)
  const lastWithdrawal = latest(withdrawals)
  const after = (r: LedgerRow) => lastWithdrawal === null || cmp(r, lastWithdrawal) > 0

  const activeRow = latest(rows.filter((r) => r.consent && r.confirmed_at !== null && after(r)))
  const pendingRow = activeRow
    ? null
    : latest(rows.filter((r) => r.consent && r.confirmed_at === null && after(r)))

  let status: EmailStatus = 'none'
  if (activeRow) status = 'active'
  else if (pendingRow) status = 'pending'
  else if (lastWithdrawal) status = 'withdrawn'

  return {
    status,
    activeRow,
    pendingRow,
    lastWithdrawalAt: lastWithdrawal ? lastWithdrawal.consented_at : null,
  }
}

export function resolveActiveSubscribers(rows: LedgerRow[]): Map<string, LedgerRow> {
  const out = new Map<string, LedgerRow>()
  for (const [email, list] of groupByEmail(rows)) {
    const s = resolveEmailState(list)
    if (s.status === 'active' && s.activeRow) out.set(email, s.activeRow)
  }
  return out
}

const RESEND_WINDOW_MS = 24 * 3600 * 1000

export type SubscribeAction = 'skip_active' | 'skip_recent_pending' | 'create'

export function decideSubscribeAction(state: EmailState, nowMs: number): SubscribeAction {
  if (state.status === 'active') return 'skip_active'
  if (state.status === 'pending' && state.pendingRow?.confirmation_sent_at) {
    const sent = Date.parse(state.pendingRow.confirmation_sent_at)
    if (Number.isFinite(sent) && nowMs - sent < RESEND_WINDOW_MS) return 'skip_recent_pending'
  }
  return 'create'
}

/** A row can be confirmed unless it is a withdrawal or a later withdrawal supersedes it. */
export function canConfirmRow(rowsForEmail: LedgerRow[], rowId: number): boolean {
  const row = rowsForEmail.find((r) => r.id === rowId)
  if (!row || !row.consent) return false
  const lastWithdrawal = latest(rowsForEmail.filter((r) => !r.consent))
  return lastWithdrawal === null || cmp(row, lastWithdrawal) > 0
}
