/**
 * Pure pop-up rules (plan 07-06, D-11): frequency capping, exclusions, triggers.
 * No browser access here; the component passes values in.
 */

export const POPUP_STORAGE_KEY = 'gc_nl_popup'
export const POPUP_TTL_MS = 90 * 24 * 60 * 60 * 1000
export const DESKTOP_ARM_MS = 10_000
export const MOBILE_DELAY_MS = 45_000
export const MOBILE_SCROLL_RATIO = 0.6

export type PopupState = 'dismissed' | 'subscribed'
export type PopupMemory = { state: PopupState; until: number }

const EXCLUDED_SEGMENTS = ['review', 'newsletter', 'wifi']

// Segment match on the first path segment: '/reviewer' is not '/review'.
export function isExcludedPath(pathname: string): boolean {
  const first = pathname.split('/').filter(Boolean)[0]
  return first !== undefined && EXCLUDED_SEGMENTS.includes(first)
}

export function parsePopupMemory(raw: string | null): PopupMemory | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<PopupMemory> | null
    if (
      v &&
      (v.state === 'dismissed' || v.state === 'subscribed') &&
      typeof v.until === 'number' &&
      Number.isFinite(v.until)
    ) {
      return { state: v.state, until: v.until }
    }
  } catch {
    // fall through
  }
  return null
}

export function buildPopupMemory(state: PopupState, now: number): string {
  return JSON.stringify({ state, until: now + POPUP_TTL_MS })
}

export function isPopupSuppressed(memory: PopupMemory | null, now: number): boolean {
  return memory !== null && memory.until > now
}

export function scrollRatio(scrollY: number, innerHeight: number, scrollHeight: number): number {
  if (scrollHeight <= 0) return 1
  return Math.min(1, Math.max(0, (scrollY + innerHeight) / scrollHeight))
}

export function shouldShowPopup(input: {
  memory: PopupMemory | null
  now: number
  pathname: string
  reservationActive: boolean
}): boolean {
  if (input.reservationActive) return false
  if (isExcludedPath(input.pathname)) return false
  return !isPopupSuppressed(input.memory, input.now)
}
