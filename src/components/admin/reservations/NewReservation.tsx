'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Plus, X } from 'lucide-react'
import { Button } from '../Button'
import { useToast } from '../Toast'
import { krabiTodayYmd } from '@/utils/krabi-time'
import ManualReservationForm from './ManualReservationForm'
import './reservations.css'

type Listener = () => void

type NewReservationApi = {
  /** Ouvre le dialogue de saisie ; `date` (YYYY-MM-DD) préremplit la date, sinon la date affichée, sinon aujourd'hui à Krabi. */
  open: (date?: string) => void
  /** Date que la page affichée propose par défaut (null = pas de préférence). */
  setDayHint: (date: string | null) => void
  /** Abonnement aux créations réussies (la liste affichée se recharge). */
  subscribe: (listener: Listener) => () => void
}

const NOOP_API: NewReservationApi = { open: () => {}, setDayHint: () => {}, subscribe: () => () => {} }
const Ctx = createContext<NewReservationApi>(NOOP_API)

export function useNewReservation(): NewReservationApi {
  return useContext(Ctx)
}

/** La page affichée déclare son jour : le dialogue global s'ouvre sur cette date. */
export function useDayHint(date: string | null) {
  const { setDayHint } = useNewReservation()
  useEffect(() => {
    setDayHint(date)
    return () => setDayHint(null)
  }, [date, setDayHint])
}

/** Recharge la page affichée quand une réservation est créée depuis le dialogue global. */
export function useOnReservationCreated(refetch: () => void) {
  const { subscribe } = useNewReservation()
  useEffect(() => subscribe(refetch), [subscribe, refetch])
}

/**
 * Dialogue global « + Réservation » (RSV-04), ouvrable depuis n'importe quelle page de l'admin :
 * bouton de l'en-tête, états vides, et l'adresse `?nouvelle=1` (le lien de l'en-tête reste valide
 * sans JavaScript). Monté une fois sous AdminProviders.
 */
export function NewReservationProvider({ children, portalClass = 'adm-portal' }: { children: ReactNode; portalClass?: string }) {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState(() => krabiTodayYmd())
  const hint = useRef<string | null>(null)
  const listeners = useRef(new Set<Listener>())
  const firstField = useRef<HTMLInputElement>(null)

  const open = useCallback((d?: string) => {
    setDate(d ?? hint.current ?? krabiTodayYmd())
    setIsOpen(true)
  }, [])
  const setDayHint = useCallback((d: string | null) => {
    hint.current = d
  }, [])
  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l)
    return () => {
      listeners.current.delete(l)
    }
  }, [])

  // Adresse `?nouvelle=1` : ouvre le dialogue puis retire le paramètre (un rechargement ne le rouvre pas).
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('nouvelle') !== '1') return
    url.searchParams.delete('nouvelle')
    window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash)
    queueMicrotask(() => open())
  }, [open])

  function created() {
    setIsOpen(false)
    toast.success('Réservation ajoutée')
    listeners.current.forEach((l) => l())
  }

  return (
    <Ctx.Provider value={{ open, setDayHint, subscribe }}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal className={portalClass}>
          <Dialog.Backdrop className="adm-scrim" />
          <Dialog.Popup className="rv-sheet" initialFocus={firstField}>
            <div className="rv-sheet__head">
              <Dialog.Title className="rv-sheet__title">Nouvelle réservation</Dialog.Title>
              <Dialog.Close className="adm-btn adm-btn--ghost adm-btn--icon" aria-label="Fermer">
                <X className="i" aria-hidden="true" focusable="false" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="adm-sr-only">
              Saisir une réservation prise par téléphone, WhatsApp ou sans réservation. Heures de Krabi.
            </Dialog.Description>
            <ManualReservationForm defaultDate={date} onCreated={created} onCancel={() => setIsOpen(false)} firstFieldRef={firstField} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Ctx.Provider>
  )
}

/** « + Réservation » de l'en-tête : un lien valide (`?nouvelle=1`) qui ouvre le dialogue global sans quitter la page. */
export function NewReservationLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel: string }) {
  const { open } = useNewReservation()
  return (
    <a
      className="adm-btn adm-btn--primary adm-newres"
      href={href}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        open()
      }}
    >
      <Plus className="i i-sm" aria-hidden="true" focusable="false" strokeWidth={1.75} />
      {label}
    </a>
  )
}

/** Bouton « + Réservation » pour les états vides. */
export function NewReservationButton({ date, children = '+ Réservation' }: { date?: string; children?: ReactNode }) {
  const { open } = useNewReservation()
  return (
    <Button variant="primary" onClick={() => open(date)}>
      {children}
    </Button>
  )
}
