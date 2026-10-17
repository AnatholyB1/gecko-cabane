'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { NewsletterSource } from '@/utils/newsletter-schema'
import { primaryDarkClass, primaryLightClass } from '@/components/ui/buttonClasses'

type Props = {
  source: NewsletterSource
  variant: 'dark' | 'light'
  showResident?: boolean
  submitLabel?: 'default' | 'recipe'
  idPrefix: string
  onSuccess?: () => void
}

type FieldErrors = { email?: boolean; consent?: boolean }

// UX-only check; the server schema is authoritative (T-07-03-01).
function looksLikeEmail(value: string): boolean {
  const v = value.trim()
  const at = v.indexOf('@')
  return at > 0 && v.indexOf('.', at) > at + 1 && !v.endsWith('.') && !/\s/.test(v)
}

export default function NewsletterForm({
  source,
  variant,
  showResident = false,
  submitLabel = 'default',
  idPrefix,
  onSuccess,
}: Props) {
  const t = useTranslations('newsletter.form')
  const locale = useLocale()
  const dark = variant === 'dark'

  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [resident, setResident] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [panelError, setPanelError] = useState<'server' | 'rateLimit' | null>(null)
  // Fill-time check: timestamp captured once on mount (not rendered, so SSR mismatch is harmless).
  const [startedAt] = useState(() => Date.now())

  const textClass = dark ? 'text-gc-ivory' : 'text-gc-text-dark'
  const mutedClass = dark ? 'text-gc-ivory/70' : 'text-gc-text-mid'
  const errorColor = dark ? 'text-[#E8836B]' : 'text-[#B3402A]'
  const errorBorder = dark ? 'border-[#E8836B]' : 'border-[#B3402A]'
  const inputBorder = dark ? 'border-gc-ivory/30' : 'border-gc-aged'
  const emailId = `${idPrefix}-email`
  const consentId = `${idPrefix}-consent`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    const errors: FieldErrors = {
      email: !looksLikeEmail(email),
      consent: !consent,
    }
    if (errors.email || errors.consent) {
      setFieldErrors({ email: errors.email || undefined, consent: errors.consent || undefined })
      return
    }
    setFieldErrors({})
    setPanelError(null)
    setStatus('submitting')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          locale,
          source,
          consent: true,
          resident,
          website,
          started_at: startedAt,
        }),
      })
      if (res.ok) {
        setStatus('success')
        onSuccess?.()
        return
      }
      setStatus('idle')
      if (res.status === 400) {
        const body = (await res.json().catch(() => ({}))) as { code?: string }
        if (body.code === 'email') return setFieldErrors({ email: true })
        if (body.code === 'consent') return setFieldErrors({ consent: true })
      }
      setPanelError(res.status === 429 ? 'rateLimit' : 'server')
    } catch {
      setStatus('idle')
      setPanelError('server')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className={`text-left ${textClass}`}>
        <p className="font-cinzel font-normal text-[20px] leading-[1.2] tracking-wide">{t('successTitle')}</p>
        <p className={`font-cormorant text-[17px] leading-[1.5] mt-2 ${mutedClass}`}>{t('successBody')}</p>
      </div>
    )
  }

  const pending = status === 'submitting'

  return (
    <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-4 text-left">
      <div>
        <label htmlFor={emailId} className={`block font-raleway text-[14px] font-medium leading-normal ${textClass}`}>
          {t('emailLabel')}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          readOnly={pending}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
          className={`mt-1 w-full min-h-11 px-3 font-cormorant text-[17px] border ${
            fieldErrors.email ? errorBorder : inputBorder
          } ${dark ? 'bg-transparent text-gc-ivory' : 'bg-transparent text-gc-text-dark'}`}
        />
        {fieldErrors.email && (
          <p id={`${emailId}-error`} className={`font-cormorant text-[14px] mt-1 ${errorColor}`}>
            {t('errorEmail')}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={consentId}
          className={`flex items-start gap-2 min-h-11 font-cormorant text-[14px] leading-normal cursor-pointer ${textClass}`}
        >
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            required
            aria-required="true"
            checked={consent}
            disabled={pending}
            onChange={(ev) => setConsent(ev.target.checked)}
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? `${consentId}-error` : undefined}
            className="accent-gc-gold w-5 h-5 mt-0.5 shrink-0"
          />
          <span>
            {t.rich('consent', {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  onClick={(ev) => ev.stopPropagation()}
                  className="underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {fieldErrors.consent && (
          <p id={`${consentId}-error`} className={`font-cormorant text-[14px] mt-1 ${errorColor}`}>
            {t('errorConsent')}
          </p>
        )}
      </div>

      {showResident && (
        <label
          htmlFor={`${idPrefix}-resident`}
          className={`flex items-center gap-2 min-h-11 font-cormorant text-[14px] cursor-pointer ${textClass}`}
        >
          <input
            id={`${idPrefix}-resident`}
            name="resident"
            type="checkbox"
            checked={resident}
            disabled={pending}
            onChange={(ev) => setResident(ev.target.checked)}
            className="accent-gc-gold w-5 h-5 shrink-0"
          />
          <span>{t('resident')}</span>
        </label>
      )}

      {/* Honeypot: hidden from users and assistive tech */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(ev) => setWebsite(ev.target.value)}
        />
      </div>

      {panelError && (
        <div role="alert" className={`font-cormorant text-[14px] ${errorColor}`}>
          {panelError === 'rateLimit' ? t('errorRateLimit') : t('errorServer')}
        </div>
      )}

      <button
        type="submit"
        aria-busy={pending}
        className={dark ? primaryDarkClass : primaryLightClass}
      >
        {pending ? t('submitting') : submitLabel === 'recipe' ? t('submitRecipe') : t('submit')}
      </button>
    </form>
  )
}
