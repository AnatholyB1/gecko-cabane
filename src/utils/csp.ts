/**
 * Content-Security-Policy (SEC-05), applied (not Report-Only) to every route.
 *
 * Why no nonce and no hash for scripts: public pages are SSG/ISR (phase 18). A per-request nonce would force
 * dynamic rendering and break the public cache. Next.js App Router emits inline scripts for hydration
 * (self.__next_f.push(...) flight data, different on every page and build), so a static hash list is not
 * feasible either. Compromise: script-src 'self' 'unsafe-inline'. Mitigations that remain: no unsafe-eval in
 * production, object-src 'none', base-uri 'self', frame-ancestors 'self', form-action 'self', connect-src and
 * frame-src pinned to the origins the site really uses. JSON-LD blocks (type application/ld+json) are data,
 * not executed, so CSP does not constrain them.
 *
 * style-src 'unsafe-inline': React style={{}} attributes and next/font inline @font-face rules.
 *
 * Origins (inventory, see .planning/phases/20-securite-a11y-mesure/20b-BUILD-REPORT.md):
 * - Plausible: first-party proxy /gcm (script + events), covered by 'self'.
 * - Sentry browser SDK: tunnelRoute /monitoring, covered by connect-src 'self' (no direct ingest origin).
 * - Fonts: next/font/google self-hosts at build, font-src 'self'.
 * - Images: next/image local only; data:/blob: for inline placeholders.
 * - Google Maps: click-to-load iframe https://www.google.com/maps ... output=embed => frame-src only.
 */

export type CspOptions = {
  /** Development needs eval for React refresh / source maps. Never true in production. */
  dev?: boolean
  /** Adds upgrade-insecure-requests (skipped on plain-http local runs where it breaks assets). */
  upgradeInsecureRequests?: boolean
}

export function buildCsp(options: CspOptions = {}): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"]
  if (options.dev) scriptSrc.push("'unsafe-eval'")

  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', scriptSrc],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:']],
    ['font-src', ["'self'", 'data:']],
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
