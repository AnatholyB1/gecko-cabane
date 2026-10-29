'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { buildWhatsAppUrl, getWhatsAppNumber } from '@/utils/whatsapp'
import { getLineUrl } from '@/utils/line'
import { EVENTS, track } from '@/utils/analytics'
import { readAttribution } from '@/utils/attribution'

const TOOLTIP_CLASS =
  'hidden md:block absolute right-full mr-3 whitespace-nowrap pointer-events-none bg-gc-void text-gc-ivory font-cormorant text-[14px] px-4 py-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'

const FOCUS_CLASS =
  'focus-visible:ring-2 focus-visible:ring-gc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gc-void'

export default function FloatingContact() {
  const tw = useTranslations('whatsapp')
  const tl = useTranslations('line')
  const locale = useLocale()
  const lineUrl = getLineUrl()
  const [hidden, setHidden] = useState(false)

  // Mobile safety: hide the whole stack while the reservation submit button is in the viewport.
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    let observer: IntersectionObserver | null = null
    let intersecting = false

    const update = () => setHidden(mql.matches && intersecting)

    const target = document.getElementById('reservation-submit')
    if (target) {
      observer = new IntersectionObserver((entries) => {
        intersecting = entries.some((e) => e.isIntersecting)
        update()
      })
      observer.observe(target)
    }

    mql.addEventListener('change', update)
    return () => {
      observer?.disconnect()
      mql.removeEventListener('change', update)
    }
  }, [])

  // Read at click time, after AttributionCapture stored the landing params (D-03).
  const clickProps = (): Record<string, string> => {
    const src = readAttribution().utm_source
    return src ? { locale, src } : { locale }
  }

  const whatsappHref = buildWhatsAppUrl(getWhatsAppNumber(), tw('prefill'))

  return (
    <div
      className={`fixed z-40 bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-3 items-end transition-opacity duration-200${
        hidden ? ' opacity-0 pointer-events-none' : ''
      }`}
    >
      {lineUrl && (
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tl('ariaLabel')}
          tabIndex={hidden ? -1 : undefined}
          aria-hidden={hidden || undefined}
          onClick={() => track(EVENTS.lineClick, clickProps())}
          className={`group relative w-14 h-14 rounded-full bg-gc-line hover:bg-gc-line-dark focus-visible:bg-gc-line-dark shadow-lg flex items-center justify-center transition-[opacity,background-color] duration-200 ${FOCUS_CLASS}`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="#FFFFFF"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.5 4.9 3.9 6.4-.1.8-.5 2.2-1.4 3.4 1.9-.3 3.6-1.2 4.8-2.1.8.2 1.7.3 2.7.3 5.5 0 10-3.6 10-8s-4.5-8-10-8z" />
          </svg>
          <span className={TOOLTIP_CLASS}>{tl('label')}</span>
        </a>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tw('ariaLabel')}
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden || undefined}
        onClick={() => track(EVENTS.whatsappClick, clickProps())}
        className={`group relative w-14 h-14 rounded-full bg-gc-whatsapp hover:bg-gc-whatsapp-dark focus-visible:bg-gc-whatsapp-dark shadow-lg flex items-center justify-center transition-[opacity,background-color] duration-200 ${FOCUS_CLASS}`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#FFFFFF"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className={TOOLTIP_CLASS}>{tw('label')}</span>
      </a>
    </div>
  )
}
