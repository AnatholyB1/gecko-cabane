'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { secondaryLightClass } from '@/components/ui/buttonClasses'

export default function WifiCopyButton({ value }: { value: string }) {
  const t = useTranslations('wifi')
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable: the password stays selectable (select-all).
    }
  }

  return (
    <div>
      <button type="button" onClick={copy} className={`${secondaryLightClass} min-h-11`}>
        {t('copy')}
      </button>
      <span aria-live="polite" className="block font-cormorant text-[14px] leading-[1.5] text-gc-text-mid mt-2 min-h-[21px]">
        {copied ? t('copied') : ''}
      </span>
    </div>
  )
}
