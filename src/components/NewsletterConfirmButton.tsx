'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { primaryLightClass, secondaryLightClass } from '@/components/ui/buttonClasses'
import { guideUrl, recipeUrl } from '@/utils/newsletter-links'

type Props = { r: string; e: string; s: string }

type State =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'done'; status: 'confirmed' | 'already'; recipe: boolean }
  | { kind: 'invalid' }
  | { kind: 'error' }

export default function NewsletterConfirmButton({ r, e, s }: Props) {
  const t = useTranslations('newsletter.confirm')
  const locale = useLocale()
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function confirm() {
    setState({ kind: 'pending' })
    try {
      const res = await fetch('/api/newsletter/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r, e, s }),
      })
      if (res.status === 400) {
        setState({ kind: 'invalid' })
        return
      }
      if (!res.ok) {
        setState({ kind: 'error' })
        return
      }
      const json = (await res.json()) as {
        data?: { status: 'confirmed' | 'already'; recipe: boolean }
      }
      if (!json.data) {
        setState({ kind: 'error' })
        return
      }
      setState({ kind: 'done', status: json.data.status, recipe: json.data.recipe })
    } catch {
      setState({ kind: 'error' })
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="mt-6" role="status">
        <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">
          {t(state.status === 'confirmed' ? 'success' : 'already')}
        </p>
        <div className="flex flex-col gap-4 mt-6">
          <a href={guideUrl(locale)} className={primaryLightClass}>
            {t('guideCta')}
          </a>
          {state.recipe && (
            <a href={recipeUrl(locale)} className={primaryLightClass}>
              {t('recipeCta')}
            </a>
          )}
          <Link href="/" className={secondaryLightClass}>
            {t('back')}
          </Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'invalid') {
    return (
      <div className="mt-6" role="alert">
        <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">{t('invalid')}</p>
        <div className="mt-6">
          <Link href="/" className={primaryLightClass}>
            {t('invalidCta')}
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
        onClick={confirm}
        disabled={pending}
        aria-busy={pending}
        className={`${primaryLightClass} disabled:opacity-70`}
      >
        {t(pending ? 'confirming' : 'button')}
      </button>
    </div>
  )
}
