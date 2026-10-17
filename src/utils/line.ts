/**
 * LINE contact URL (RESA-05, D-22, T-05-16). Pure and client-safe.
 * The button only renders when NEXT_PUBLIC_LINE_URL is a valid https LINE URL.
 */

export const LINE_HOSTS = ['line.me', 'lin.ee', 'page.line.me'] as const

export function parseLineUrl(raw: string | undefined | null): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    if (!(LINE_HOSTS as readonly string[]).includes(url.hostname)) return null
    if (url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

export function getLineUrl(): string | null {
  // Literal access: Next inlines NEXT_PUBLIC_* only on literal property reads.
  return parseLineUrl(process.env.NEXT_PUBLIC_LINE_URL)
}
