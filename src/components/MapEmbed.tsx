'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

// D-20: the Google Maps iframe is mounted only after an explicit click.
export default function MapEmbed({ src }: { src: string }) {
  const t = useTranslations('contactSection')
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loaded) ref.current?.focus()
  }, [loaded])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="relative w-full h-72 md:h-80 overflow-hidden outline-none"
      style={{ border: '1px solid rgba(198,155,60,0.2)' }}
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold z-10 pointer-events-none" />
      {loaded ? (
        <iframe
          src={src}
          title={t('mapTitle')}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : (
        <>
          <Image
            src="/exterior-sign.jpg"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gc-void/70" aria-hidden="true" />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-ivory border border-gc-gold px-6 py-3 min-h-11 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
            >
              {t('showMap')}
            </button>
            <p className="font-cormorant text-[17px] text-gc-ivory/75">{t('mapPrivacy')}</p>
          </div>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {loaded ? t('mapLoaded') : ''}
      </span>
    </div>
  )
}
