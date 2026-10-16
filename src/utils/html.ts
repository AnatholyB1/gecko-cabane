/**
 * HTML helpers for email templates.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escapes & < > " ' ; null/undefined become an empty string. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

/** Replaces CR and LF with a space (prevents header injection in subjects). */
export function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]/g, ' ')
}
