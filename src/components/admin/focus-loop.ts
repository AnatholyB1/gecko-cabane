/**
 * Boucle de focus d'un dialogue modal (QA-02).
 *
 * Base UI pose des gardes de focus (`<span tabindex="0">`) hors de la fenêtre : avec le reste de l'app
 * rendu `inert`, un Tab depuis le dernier bouton s'arrêtait sur une garde muette puis sur le document
 * (mesuré à 1440 px : 26 arrêts hors dialogue sur 36 Tab). On intercepte donc Tab / Maj+Tab dans la
 * fenêtre et on boucle premier <-> dernier élément focalisable : le focus ne quitte jamais le dialogue.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

type TabEvent = { key: string; shiftKey: boolean; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; preventDefault: () => void }

export function focusableIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('data-base-ui-focus-guard') && !el.hasAttribute('inert') && el.getClientRects().length > 0,
  )
}

/** Renvoie l'élément à focaliser à la place du comportement natif, ou null si le Tab natif suffit. */
export function nextTabTarget(items: readonly HTMLElement[], active: Element | null, shift: boolean): HTMLElement | null {
  if (items.length === 0) return null
  const first = items[0]
  const last = items[items.length - 1]
  const index = active ? items.indexOf(active as HTMLElement) : -1
  if (shift) return index <= 0 ? last : null
  return index === -1 || index === items.length - 1 ? first : null
}

export function trapTab(e: TabEvent, root: HTMLElement): void {
  if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return
  const target = nextTabTarget(focusableIn(root), root.ownerDocument.activeElement, e.shiftKey)
  if (!target) return
  e.preventDefault()
  target.focus()
}
