'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { buildWhatsAppUrl, getWhatsAppNumber } from '@/utils/whatsapp'

type Props = { src: string; rid: string | null; maxLength: number }
type Status = 'idle' | 'pending' | 'success' | 'error'
type ErrorKind = 'message' | 'email' | 'generic' | 'rateLimited' | null

export default function ReviewFeedbackForm({ src, rid, maxLength }: Props) {
  const t = useTranslations('reviewFeedback')
  const tw = useTranslations('whatsapp')
  const locale = useLocale()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorKind, setErrorKind] = useState<ErrorKind>(null)
  const [startedAt] = useState(() => Date.now())
  const startedRef = useRef(startedAt)

  const pending = status === 'pending'
  const nearLimit = message.length >= maxLength - 50

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setStatus('pending')
    setErrorKind(null)
    try {
      const res = await fetch('/api/review/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          email,
          src,
          rid,
          locale,
          company_url: companyUrl,
          form_started_at: startedRef.current,
        }),
      })
      if (res.ok) {
        setStatus('success')
        return
      }
      let code: string | undefined
      try {
        code = (await res.json()).code
      } catch {
        code = undefined
      }
      setStatus('error')
      if (res.status === 429) setErrorKind('rateLimited')
      else if (code === 'invalid_message') setErrorKind('message')
      else if (code === 'invalid_email') setErrorKind('email')
      else setErrorKind('generic')
    } catch {
      setStatus('error')
      setErrorKind('generic')
    }
  }

  const wrapper = 'w-10 h-px bg-gc-gold mx-auto mt-10'
  const labelClass = 'block font-raleway text-[12px] uppercase tracking-[0.1em] text-gc-text-mid mb-2'
  const fieldClass =
    'w-full bg-white/60 border border-gc-aged focus:border-gc-gold focus:outline-none text-gc-text-dark font-cormorant text-[17px] p-4'

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className={wrapper} />
        <p role="status" className="font-cormorant text-[17px] text-gc-text-dark mt-6">
          {t('success')}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={wrapper} />
      <h2 className="font-cinzel font-normal text-[20px] leading-[1.2] tracking-wide text-gc-text-dark mt-6">
        {t('title')}
      </h2>
      <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark mt-3">{t('lead')}</p>

      <form onSubmit={onSubmit} aria-busy={pending} className="relative mt-6 text-left space-y-5">
        <div>
          <label htmlFor="rf-message" className={labelClass}>
            {t('messageLabel')}
          </label>
          <textarea
            id="rf-message"
            required
            rows={5}
            maxLength={maxLength}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={errorKind === 'message' || undefined}
            aria-describedby={errorKind === 'message' ? 'rf-message-error' : undefined}
            className={`${fieldClass} min-h-32`}
          />
          <p
            className="font-raleway text-[12px] text-gc-text-mid mt-1 text-right"
            aria-live={nearLimit ? 'polite' : undefined}
          >
            {t('counter', { count: message.length, max: maxLength })}
          </p>
          {errorKind === 'message' && (
            <p id="rf-message-error" role="alert" className="font-cormorant text-[15px] text-[#B91C1C] mt-1">
              {t('errorMessage')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="rf-email" className={labelClass}>
            {t('emailLabel')}
          </label>
          <input
            id="rf-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errorKind === 'email' || undefined}
            aria-describedby={errorKind === 'email' ? 'rf-email-error' : 'rf-email-help'}
            className={`${fieldClass} min-h-11`}
          />
          <p id="rf-email-help" className="font-cormorant italic text-[14px] text-gc-text-mid mt-1">
            {t('emailHelp')}
          </p>
          {errorKind === 'email' && (
            <p id="rf-email-error" role="alert" className="font-cormorant text-[15px] text-[#B91C1C] mt-1">
              {t('errorEmail')}
            </p>
          )}
        </div>

        {/* Honeypot: off-screen, never display:none */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <input
            type="text"
            name="company_url"
            tabIndex={-1}
            autoComplete="off"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
          />
        </div>

        {errorKind === 'generic' && (
          <p role="alert" className="font-cormorant text-[15px] text-[#B91C1C]">
            {t('errorGeneric')}
          </p>
        )}
        {errorKind === 'rateLimited' && (
          <p role="alert" className="font-cormorant text-[15px] text-[#B91C1C]">
            {t('errorRateLimited')}{' '}
            <a
              href={buildWhatsAppUrl(getWhatsAppNumber(), tw('prefill'))}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t('whatsappLink')}
            </a>
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gc-jungle text-gc-ivory hover:bg-gc-void disabled:opacity-60 font-cinzel text-[12px] uppercase tracking-[0.15em] px-8 py-3 min-h-11 transition-colors duration-200"
        >
          {pending ? t('pending') : t('submit')}
        </button>
      </form>
    </div>
  )
}
