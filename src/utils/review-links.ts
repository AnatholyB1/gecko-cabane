/**
 * Review entry point helpers (REV-01): token/source guards, locale resolution and
 * redirect path building for the /review, /avis, /bewertung aliases.
 *
 * Pure module: no next/server, supabase or resend imports (safe for client code).
 */

const REVIEW_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isReviewToken(v: string | null | undefined): v is string {
  return typeof v === 'string' && REVIEW_TOKEN_RE.test(v)
}

export const REVIEW_SOURCES = ['email', 'qr', 'wa', 'site'] as const
export type ReviewSource = (typeof REVIEW_SOURCES)[number]

export function sanitizeReviewSource(v: string | null | undefined): ReviewSource | null {
  return (REVIEW_SOURCES as readonly string[]).includes(v ?? '') ? (v as ReviewSource) : null
}

/** Counter sources (D-07): allowlisted sources plus a catch-all. */
export const REVIEW_STAT_SOURCES = [...REVIEW_SOURCES, 'unknown'] as const
export type ReviewStatSource = (typeof REVIEW_STAT_SOURCES)[number]

export const REVIEW_HIT_KINDS = ['visit', 'google', 'tripadvisor'] as const
export type ReviewHitKind = (typeof REVIEW_HIT_KINDS)[number]

/** A valid rid only ever comes from an email link; otherwise allowlisted src or 'unknown'. */
export function normalizeReviewSource(src: unknown, rid: unknown): ReviewStatSource {
  if (typeof rid === 'string' && isReviewToken(rid)) return 'email'
  return sanitizeReviewSource(typeof src === 'string' ? src : null) ?? 'unknown'
}

export type ReviewPageLocale = 'fr' | 'en' | 'de' | 'sv'

/**
 * Locales with their own review page. 'de' added after the owner's written validation
 * of docs/ph6/review/de/review.md (2026-10-18); 'sv' added after the owner's written validation of docs/ph6/review/sv/review.md (2026-10-29).
 */
export const REVIEW_LOCALES: readonly ReviewPageLocale[] = ['fr', 'en', 'de', 'sv']

function mapLanguage(tag: string | null | undefined): ReviewPageLocale | null {
  if (!tag) return null
  const primary = tag.trim().toLowerCase().split('-')[0]
  if ((REVIEW_LOCALES as readonly string[]).includes(primary)) return primary as ReviewPageLocale
  if (primary === 'en' || primary === 'de' || primary === 'sv') return 'en'
  return null
}

/** Parses Accept-Language by q-value (stable on ties); first supported language wins. */
export function pickAcceptLanguage(header: string | null): ReviewPageLocale | null {
  if (!header) return null
  const entries = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      let q = 1
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/i)
        if (m) {
          const n = Number(m[1])
          q = Number.isFinite(n) ? n : 0
        }
      }
      return { tag, q, index }
    })
    .filter((e) => e.tag)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  for (const e of entries) {
    const mapped = mapLanguage(e.tag)
    if (mapped) return mapped
  }
  return null
}

/** Precedence (D-10): reservation locale > alias hint > Accept-Language > en. */
export function resolveReviewLocale(args: {
  ridLocale?: string | null
  hint?: 'fr' | 'de' | null
  acceptLanguage?: string | null
}): ReviewPageLocale {
  const { ridLocale, hint, acceptLanguage } = args
  const fromRid = ['fr', 'en', 'de', 'sv'].includes(ridLocale ?? '') ? mapLanguage(ridLocale) : null
  if (fromRid) return fromRid
  const fromHint = mapLanguage(hint)
  if (fromHint) return fromHint
  return pickAcceptLanguage(acceptLanguage ?? null) ?? 'en'
}

/** Open-redirect guard: path is always '/' + whitelisted locale + '/review'. */
export function buildReviewRedirectPath(
  locale: ReviewPageLocale,
  params: { rid?: string | null; src?: string | null }
): string {
  const search = new URLSearchParams()
  if (isReviewToken(params.rid)) search.set('rid', params.rid)
  const src = sanitizeReviewSource(params.src)
  if (src) search.set('src', src)
  const qs = search.toString()
  return `/${locale}/review${qs ? `?${qs}` : ''}`
}
