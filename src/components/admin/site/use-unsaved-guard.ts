'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConfirm } from '../ConfirmDialog'
import { isTabHash } from './site-logic'

export type GuardLocation = { origin: string; pathname: string; search: string; hash: string }
export type GuardTarget = { kind: 'hash'; hash: string } | { kind: 'path'; to: string }

/**
 * Où mène un lien, du point de vue de la garde « modifications non enregistrées » ?
 * `null` = pas de garde (lien externe, même adresse, ancre hors onglets comme « Aller au contenu »).
 */
export function guardTarget(href: string, here: GuardLocation): GuardTarget | null {
  let url: URL
  try {
    url = new URL(href, `${here.origin}${here.pathname}${here.search}`)
  } catch {
    return null
  }
  if (url.origin !== here.origin) return null
  if (url.pathname === here.pathname && url.search === here.search) {
    if (url.hash === here.hash) return null
    return isTabHash(url.hash) ? { kind: 'hash', hash: url.hash } : null
  }
  return { kind: 'path', to: `${url.pathname}${url.search}${url.hash}` }
}

/**
 * Garde des modifications non enregistrées (SITE-02) tant que `dirty` est vrai :
 * - fermeture ou rechargement de l'onglet du navigateur : confirmation native du navigateur ;
 * - clic sur un lien interne (menu, onglets de section, autre page) : dialogue
 *   « Quitter sans enregistrer ? » (focus initial sur « Rester ici »), puis navigation.
 *   Le clic est intercepté en phase de capture, avant le routeur de Next.js.
 */
export function useUnsavedGuard(dirty: boolean, what: string) {
  const confirm = useConfirm()
  const router = useRouter()

  useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      const anchor = target?.closest('a[href]')
      if (!anchor || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return
      // L'onglet déjà ouvert : rien à quitter.
      if (anchor.getAttribute('aria-selected') === 'true') return
      const dest = guardTarget(anchor.getAttribute('href') ?? '', {
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      })
      if (!dest) return
      e.preventDefault()
      e.stopPropagation()
      void confirm({
        title: 'Quitter sans enregistrer ?',
        description: `Vos modifications ${what} seront perdues.`,
        confirmLabel: 'Quitter sans enregistrer',
        cancelLabel: 'Rester ici',
      }).then((leave) => {
        if (!leave) return
        if (dest.kind === 'hash') window.location.hash = dest.hash
        else router.push(dest.to)
      })
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, what, confirm, router])
}
