'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { secondaryLightClass } from '@/components/ui/buttonClasses'

type Props = { r: string; s: string }

type State = { kind: 'idle' } | { kind: 'pending' } | { kind: 'done' } | { kind: 'error' }

export default function NewsletterUnsubscribeButton({ r, s }: Props) {
  const t = useTranslations('newsletter.unsubscribe')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function unsubscribe() {
    setState({ kind: 'pending' })
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r, s }),
      })
      setState({ kind: res.ok ? 'done' : 'error' })
    } catch {
      setState({ kind: 'error' })
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="mt-6" role="status">
        <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">{t('success')}</p>
        <p
          className="text-[14px] leading-[1.5] text-gc-text-dark mt-4"
          style={{ fontFamily: 'var(--font-raleway)' }}
        >
          {t('legal')}
        </p>
        <div className="mt-6">
          <Link href="/" className="font-cormorant text-[17px] underline text-gc-text-dark">
            {t('resubscribe')}
          </Link>
        </div>
      </div>
    )
  }

  const pending = state.kind === 'pending'
  return (
    <div className="mt-6">
      {state.kind === 'error' && (
        <p role="alert" className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark mb-4">
          {t('error')}
        </p>
      )}
      <button
        type="button"
        onClick={unsubscribe}
        disabled={pending}
        aria-busy={pending}
        className={`${secondaryLightClass} disabled:opacity-70`}
      >
        {t(pending ? 'unsubscribing' : 'button')}
      </button>
    </div>
  )
}
