/**
 * Messages sent to the browser by NextIntlClientProvider (PERF-04).
 *
 * Only the namespaces read by Client Components are serialised into the page; the rest of
 * messages/*.json (about, menu, guides, meta...) is rendered on the server and must not weigh on every
 * page. tests/client-messages.test.ts fails when a Client Component reads a namespace missing here.
 */

export const CLIENT_NAMESPACES = [
  'announcement',
  'contactSection',
  'errors.error',
  'hours',
  'language',
  'line',
  'newsletter.confirm',
  'newsletter.form',
  'newsletter.popup',
  'newsletter.unsubscribe',
  'reservationForm',
  'reviewFeedback',
  'whatsapp',
  'wifi',
] as const

type Tree = { [key: string]: unknown }

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Keeps only the given dotted namespaces of a nested messages object (same nesting as the source). */
export function pickMessages(messages: Tree, namespaces: readonly string[]): Tree {
  const out: Tree = {}
  for (const ns of namespaces) {
    const parts = ns.split('.')
    let src: unknown = messages
    for (const part of parts) {
      src = isTree(src) ? src[part] : undefined
    }
    if (src === undefined) continue
    let dst = out
    for (const part of parts.slice(0, -1)) {
      const next = dst[part]
      if (isTree(next)) {
        dst = next
      } else {
        const created: Tree = {}
        dst[part] = created
        dst = created
      }
    }
    dst[parts[parts.length - 1]] = src
  }
  return out
}
