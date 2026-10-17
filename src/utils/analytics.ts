/**
 * Analytics helper (KPI-01, D-01..D-03): stable event names and a safe track().
 * Pure and client-safe. Plausible is cookieless and inert until the script id exists.
 */

// Owner creates goals in Plausible with these exact strings.
export const EVENTS = {
  reservationSent: 'Reservation Sent',
  whatsappClick: 'WhatsApp Click',
  lineClick: 'LINE Click',
} as const

export const PLAUSIBLE_ID_RE = /^pa-[A-Za-z0-9_-]+$/

type PlausibleFn = (name: string, options?: { props: Record<string, string> }) => void

export function getPlausibleScriptId(): string | null {
  // Literal access: Next inlines NEXT_PUBLIC_* only on literal property reads.
  const id = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID
  return id && PLAUSIBLE_ID_RE.test(id) ? id : null
}

export function track(name: string, props?: Record<string, string>): void {
  if (typeof window === 'undefined') return
  try {
    const fn = (window as unknown as { plausible?: PlausibleFn }).plausible
    if (typeof fn !== 'function') return
    fn(name, props ? { props } : undefined)
  } catch {
    // analytics never breaks the UI
  }
}
