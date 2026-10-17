'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import NewsletterForm from '@/components/NewsletterForm'
import {
  POPUP_STORAGE_KEY,
  DESKTOP_ARM_MS,
  MOBILE_DELAY_MS,
  MOBILE_SCROLL_RATIO,
  buildPopupMemory,
  parsePopupMemory,
  scrollRatio,
  shouldShowPopup,
  type PopupState,
} from '@/utils/newsletter-popup'

type Mode = 'desktop' | 'mobile'

const AUTO_CLOSE_MS = 6000

// Storage can be blocked (private mode, policies): never throw.
function readMemory() {
  try {
    return { ok: true as const, memory: parsePopupMemory(window.localStorage.getItem(POPUP_STORAGE_KEY)) }
  } catch {
    return { ok: false as const, memory: null }
  }
}

function writeMemory(state: PopupState) {
  try {
    window.localStorage.setItem(POPUP_STORAGE_KEY, buildPopupMemory(state, Date.now()))
  } catch {
    // ignore
  }
}

// Anonymous counter: no identifier, fire and forget.
function sendEvent(event: 'popup_shown' | 'popup_dismissed') {
  try {
    void fetch('/api/newsletter/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'

export default function NewsletterPopup() {
  const t = useTranslations('newsletter.popup')
  const pathname = usePathname()
  const titleId = useId()

  const [mode, setMode] = useState<Mode | null>(null)
  const [visible, setVisible] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reservationActiveRef = useRef(false)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = mode !== null

  // Arm the triggers. Nothing is attached when the pop-up cannot show.
  useEffect(() => {
    if (open) return
    const stored = readMemory()
    // Blocked storage: show nothing rather than showing on every page.
    if (!stored.ok) return
    const check = () =>
      shouldShowPopup({
        memory: readMemory().memory,
        now: Date.now(),
        pathname,
        reservationActive: reservationActiveRef.current,
      })
    if (!check()) return

    const cleanups: Array<() => void> = []
    let fired = false
    const cleanupAll = () => {
      cleanups.forEach((fn) => fn())
      cleanups.length = 0
    }

    const trigger = (m: Mode) => {
      if (fired || !check()) return
      fired = true
      cleanupAll()
      previousFocusRef.current = document.activeElement as HTMLElement | null
      writeMemory('dismissed') // leaving without closing must not re-show (D-11)
      sendEvent('popup_shown')
      setMode(m)
    }

    // Reservation funnel: never interrupt a visitor using the form.
    const markReservation = (e: Event) => {
      const section = document.getElementById('reservation')
      if (section && e.target instanceof Node && section.contains(e.target)) {
        reservationActiveRef.current = true
        cleanupAll()
      }
    }
    document.addEventListener('focusin', markReservation)
    document.addEventListener('input', markReservation)
    cleanups.push(() => document.removeEventListener('focusin', markReservation))
    cleanups.push(() => document.removeEventListener('input', markReservation))

    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (desktop) {
      const armTimer = setTimeout(() => {
        const onOut = (e: MouseEvent) => {
          if (e.relatedTarget === null && e.clientY <= 0) trigger('desktop')
        }
        document.addEventListener('mouseout', onOut)
        cleanups.push(() => document.removeEventListener('mouseout', onOut))
      }, DESKTOP_ARM_MS)
      cleanups.push(() => clearTimeout(armTimer))
    } else {
      const delay = setTimeout(() => trigger('mobile'), MOBILE_DELAY_MS)
      const onScroll = () => {
        if (scrollRatio(window.scrollY, window.innerHeight, document.documentElement.scrollHeight) >= MOBILE_SCROLL_RATIO) {
          trigger('mobile')
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => clearTimeout(delay))
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    return cleanupAll
  }, [pathname, open])

  // Entrance transition and initial focus.
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => {
      setVisible(true)
      if (mode === 'desktop') closeRef.current?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [open, mode])

  useEffect(
    () => () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    },
    [],
  )

  function closeSilently() {
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    setVisible(false)
    setMode(null)
    if (mode === 'desktop') previousFocusRef.current?.focus?.()
  }

  function dismiss() {
    writeMemory('dismissed')
    sendEvent('popup_dismissed')
    closeSilently()
  }

  function handleSuccess() {
    writeMemory('subscribed')
    autoCloseRef.current = setTimeout(() => {
      const panel = panelRef.current
      if (panel && panel.contains(document.activeElement)) return
      closeSilently()
    }, AUTO_CLOSE_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      dismiss()
      return
    }
    if (e.key !== 'Tab' || mode !== 'desktop') return
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!nodes || nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const active = document.activeElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mode) return null

  const closeButton = (
    <button
      ref={closeRef}
      type="button"
      onClick={dismiss}
      aria-label={t('close')}
      className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-gc-ivory/80 hover:text-gc-gold"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" />
      </svg>
    </button>
  )

  const content = (
    <>
      {closeButton}
      <h2 id={titleId} className="pr-10 font-cinzel text-[20px] font-normal leading-[1.2] tracking-wide text-gc-ivory">
        {t('title')}
      </h2>
      <p className="mt-2 mb-4 font-cormorant text-[17px] leading-[1.5] text-gc-ivory/80">{t('body')}</p>
      <div
        onFocusCapture={(e) => {
          if (mode === 'mobile' && e.target instanceof HTMLInputElement) {
            e.target.scrollIntoView({ block: 'nearest' })
          }
        }}
      >
        <NewsletterForm source="popup" variant="dark" showResident={false} idPrefix="nl-popup" onSuccess={handleSuccess} />
      </div>
    </>
  )

  if (mode === 'desktop') {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-gc-void/70 p-4 motion-safe:transition-opacity motion-safe:duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={dismiss}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-120 border border-gc-gold/20 border-t-2 border-t-gc-gold bg-gc-jungle p-8 motion-safe:transition motion-safe:duration-300 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label={t('regionLabel')}
      onKeyDown={handleKeyDown}
      className={`fixed inset-x-2 bottom-[88px] z-30 max-h-[35vh] overflow-y-auto border-t-2 border-gc-gold bg-gc-jungle p-4 motion-safe:transition motion-safe:duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {content}
    </div>
  )
}
