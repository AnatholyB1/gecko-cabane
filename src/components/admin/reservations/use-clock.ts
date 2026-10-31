'use client'

import { useEffect, useRef, useState } from 'react'

export const CLOCK_TICK_MS = 60_000
/** Deux déclencheurs rapprochés (focus puis visibilitychange) ne font qu'un rechargement. */
export const REFRESH_MIN_GAP_MS = 5_000

/**
 * Horloge partagée de l'admin : `now` se met à jour chaque minute et quand la fenêtre redevient
 * active (un onglet en arrière-plan ralentit les minuteurs : au retour, la date doit être juste).
 * `initialIso` vient du serveur pour que le premier rendu soit identique des deux côtés.
 */
export function useNow(initialIso?: string): Date {
  const [now, setNow] = useState(() => (initialIso ? new Date(initialIso) : new Date()))
  useEffect(() => {
    const tick = () => setNow(new Date())
    const t = setInterval(tick, CLOCK_TICK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}

/**
 * Recharge les données à chaque minute et au retour sur la fenêtre. Silencieux : les données
 * affichées restent à l'écran pendant le rechargement (pas de clignotement, état local conservé) ;
 * une requête obsolète est annulée par `useAdminQuery` quand une plus récente démarre.
 * `paused` : pas de rechargement automatique (ex. une action de statut est en cours).
 */
export function useAutoRefresh(refetch: () => Promise<boolean>, paused = false): void {
  const last = useRef(0)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])
  useEffect(() => {
    const go = () => {
      if (pausedRef.current) return
      const t = Date.now()
      if (t - last.current < REFRESH_MIN_GAP_MS) return
      last.current = t
      void refetch()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') go()
    }
    const timer = setInterval(go, CLOCK_TICK_MS)
    window.addEventListener('focus', go)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', go)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refetch])
}
