'use client'

import { useSyncExternalStore } from 'react'

const CHANGE = 'adm-locationchange'
let historyPatched = false

/**
 * Next.js change l'URL avec history.pushState/replaceState, qui ne déclenchent ni `hashchange` ni
 * `popstate`. On émet un évènement après chaque appel pour que l'ancre courante soit relue.
 */
function patchHistory() {
  if (historyPatched) return
  historyPatched = true
  for (const key of ['pushState', 'replaceState'] as const) {
    const original = window.history[key]
    window.history[key] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args)
      window.dispatchEvent(new Event(CHANGE))
      return result
    }
  }
}

function subscribe(onChange: () => void) {
  patchHistory()
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  window.addEventListener(CHANGE, onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(CHANGE, onChange)
  }
}

/** Ancre courante (`#exceptions`), `''` au rendu serveur : départage deux sous-entrées d'une même page. */
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  )
}
