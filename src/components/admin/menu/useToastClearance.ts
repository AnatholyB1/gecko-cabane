'use client'

import { useEffect } from 'react'
import { toastClearance } from './menu-logic'

/**
 * Un toast d'erreur reste affiché jusqu'à sa fermeture (en haut à droite) : sur ordinateur il recouvrirait
 * « Réorganiser » et « Ajouter un plat ». Tant qu'il est là ET qu'il chevauche ces actions, le contenu de
 * l'écran est décalé vers le bas (variable `--mn-toast-clear`). Les toasts de succès (5 s) ne décalent rien.
 */
export function useToastClearance() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.mn-root')
    if (!root) return
    let applied = 0
    let frame = 0

    function measure() {
      frame = 0
      const actions = root!.querySelector<HTMLElement>('.mn-head-actions')
      const viewport = document.querySelector<HTMLElement>('.adm-toast-viewport')
      const errors = Array.from(document.querySelectorAll<HTMLElement>('.adm-toast--error'))
      let pad = 0
      if (actions && viewport && errors.length > 0 && getComputedStyle(actions).display !== 'none') {
        const v = viewport.getBoundingClientRect()
        const height = errors.reduce((max, el) => Math.max(max, el.offsetHeight), 0) + Math.min(errors.length - 1, 3) * 12
        const a = actions.getBoundingClientRect()
        pad = toastClearance({
          actions: { top: a.top, bottom: a.bottom, left: a.left, right: a.right },
          toast: { top: v.top, bottom: v.top + height, left: v.left, right: v.right },
          appliedPad: applied,
        })
      }
      if (pad !== applied) {
        applied = pad
        root!.style.setProperty('--mn-toast-clear', `${pad}px`)
      }
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    const observer = new MutationObserver(schedule)
    observer.observe(document.querySelector('.adm-toast-viewport') ?? document.body, { childList: true, subtree: true })
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
      root.style.removeProperty('--mn-toast-clear')
    }
  }, [])
}
