/**
 * Content-Security-Policy (SEC-05), applied (not Report-Only) to every route.
 *
 * Why no nonce and no hash for scripts: public pages are SSG/ISR (phase 18). A per-request nonce would force
 * dynamic rendering and break the public cache. Next.js App Router emits inline scripts for hydration
 * (self.__next_f.push(...) flight data, different on every page and build), so a static hash list is not
 * feasible either. Compromise: script-src 'self' 'unsafe-inline'. Mitigations that remain: no unsafe-eval in
 * production, object-src 'none', base-uri 'self', frame-ancestors 'self', form-action 'self', connect-src and
 * frame-src pinned to the origins the site really uses. Structured-data (JSON-LD) blocks are data,
 * not executed, so CSP does not constrain them.
 *
 * style-src 'unsafe-inline': React style={{}} attributes and next/font inline @font-face rules.
 *
 * Origins (inventory, see .planning/phases/20-securite-a11y-mesure/20b-BUILD-REPORT.md):
 * - Plausible: first-party proxy /gcm (script + events), covered by 'self'.
 * - Sentry browser SDK: tunnelRoute /monitoring, covered by connect-src 'self' (no direct ingest origin).
 * - Fonts: next/font/google self-hosts at build, font-src 'self'.
 * - Images: next/image local only; data: for inline placeholders; the Supabase origin (storage photos);
 *   on /admin only, any https: image (hand-typed photo URLs previewed in ItemSheet). No blob:.
 * - Google Maps: click-to-load iframe https://www.google.com/maps ... output=embed => frame-src only.
 */

export type CspOptions = {
  /** Development needs eval for React refresh / source maps. Never true in production. */
  dev?: boolean
  /** Adds upgrade-insecure-requests (skipped on plain-http local runs where it breaks assets). */
  upgradeInsecureRequests?: boolean
  /** Supabase project URL (NEXT_PUBLIC_SUPABASE_URL): its origin is allowed in img-src (storage photos). */
  supabaseUrl?: string
  /**
   * Admin routes only: any https image (item photos can be a hand-typed URL, previewed in ItemSheet).
   * Never set for public pages.
   */
  admin?: boolean
}

/** Origin of a URL, or null when empty/invalid/not http(s). */
export function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null
  } catch {
    return null
  }
}

export function buildCsp(options: CspOptions = {}): string {
  const imgSrc = ["'self'", 'data:']
  const supabaseOrigin = originOf(options.supabaseUrl)
  if (supabaseOrigin) imgSrc.push(supabaseOrigin)
  if (options.admin) imgSrc.push('https:')

  const scriptSrc = ["'self'", "'unsafe-inline'"]
  if (options.dev) scriptSrc.push("'unsafe-eval'")

  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', scriptSrc],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', imgSrc],
    ['font-src', ["'self'"]],
    ['connect-src', ["'self'"]],
    ['frame-src', ['https://www.google.com']],
    ['manifest-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'self'"]],
  ]

  const parts = directives.map(([name, values]) => `${name} ${values.join(' ')}`)
  if (options.upgradeInsecureRequests) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}
