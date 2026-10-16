'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js'
import { Link } from '@/i18n/navigation'
import { phoneCountryForLocale, isEmailValid } from '@/utils/validation'
import { bangkokNow, bookableSlots, MAX_PARTY_SIZE } from '@/utils/reservation-rules'
import type { SettingsMap } from '@/utils/reservation-rules'
import { buildWhatsAppUrl, getWhatsAppNumber } from '@/utils/whatsapp'

interface Country {
  code: CountryCode
  dialCode: string
  flag: string
}

// Most common nationalities at Krabi, ordered by frequency
const COUNTRIES: Country[] = [
  { code: 'TH', dialCode: '+66',  flag: '🇹🇭' },
  { code: 'FR', dialCode: '+33',  flag: '🇫🇷' },
  { code: 'GB', dialCode: '+44',  flag: '🇬🇧' },
  { code: 'DE', dialCode: '+49',  flag: '🇩🇪' },
  { code: 'US', dialCode: '+1',   flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1',   flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61',  flag: '🇦🇺' },
  { code: 'NZ', dialCode: '+64',  flag: '🇳🇿' },
  { code: 'SG', dialCode: '+65',  flag: '🇸🇬' },
  { code: 'MY', dialCode: '+60',  flag: '🇲🇾' },
  { code: 'CN', dialCode: '+86',  flag: '🇨🇳' },
  { code: 'JP', dialCode: '+81',  flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82',  flag: '🇰🇷' },
  { code: 'IN', dialCode: '+91',  flag: '🇮🇳' },
  { code: 'RU', dialCode: '+7',   flag: '🇷🇺' },
  { code: 'SE', dialCode: '+46',  flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47',  flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45',  flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { code: 'NL', dialCode: '+31',  flag: '🇳🇱' },
  { code: 'BE', dialCode: '+32',  flag: '🇧🇪' },
  { code: 'CH', dialCode: '+41',  flag: '🇨🇭' },
  { code: 'ES', dialCode: '+34',  flag: '🇪🇸' },
  { code: 'IT', dialCode: '+39',  flag: '🇮🇹' },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { code: 'PL', dialCode: '+48',  flag: '🇵🇱' },
  { code: 'VN', dialCode: '+84',  flag: '🇻🇳' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { code: 'ZA', dialCode: '+27',  flag: '🇿🇦' },
]

// Shared input style: dark, high-contrast text on the neutral card background.
const inputClass =
  'w-full min-h-11 bg-transparent border-0 border-b-2 border-gc-text-mid/35 outline-none font-cormorant text-[17px] text-gc-text-dark placeholder:text-gc-text-mid/45 py-2 transition-colors focus:border-gc-jungle focus:ring-2 focus:ring-gc-jungle/25 disabled:opacity-50'

const selectClass =
  'gc-select-light w-full min-h-11 border-0 border-b-2 border-gc-text-mid/35 outline-none font-cormorant text-[17px] text-gc-text-dark py-2 px-1 transition-colors focus:border-gc-jungle focus:ring-2 focus:ring-gc-jungle/25 disabled:opacity-50'

const labelClass =
  'font-raleway font-medium text-[11px] tracking-[0.2em] uppercase text-gc-text-dark block'

const hintClass = 'font-cormorant italic text-[14px] text-gc-copper'

const primaryButtonClass =
  'font-cinzel font-medium text-[11px] tracking-[0.1em] uppercase whitespace-nowrap bg-gc-jungle text-gc-ivory border border-gc-jungle hover:bg-gc-void hover:border-gc-void transition-all focus:outline-none focus:ring-2 focus:ring-gc-jungle focus:ring-offset-2 focus:ring-offset-gc-parchment disabled:opacity-40 disabled:cursor-not-allowed'

type ErrorKind =
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'slotUnavailable'
  | 'slotFull'
  | 'datePast'
  | 'rateLimited'
  | 'networkError'
  | 'genericError'

// Server error code -> i18n key (reservationForm namespace)
const CODE_TO_KIND: Record<string, ErrorKind> = {
  invalid_email: 'emailInvalid',
  invalid_phone: 'phoneInvalid',
  slot_unavailable: 'slotUnavailable',
  slot_full: 'slotFull',
  date_past: 'datePast',
  rate_limited: 'rateLimited',
}

const EMPTY_FORM = {
  customer_name: '',
  customer_email: '',
  reservation_date: '',
  reservation_time: '',
  party_size: 2,
  occasion: ''
}

export default function ReservationForm() {
  const t = useTranslations('reservationForm')
  const tw = useTranslations('whatsapp')
  const locale = useLocale()
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' })
  const countryName = (code: string) => regionNames.of(code) ?? code

  const OCCASIONS = [
    { value: '', label: t('selectOptional') },
    { value: 'Anniversaire', label: t('birthday') },
    { value: 'Dîner romantique', label: t('romanticDinner') }, // i18n-ignore: stored enum value sent to API/email
    { value: 'Repas d\'affaires', label: t('businessMeal') },
    { value: 'Célébration', label: t('celebration') }, // i18n-ignore: stored enum value sent to API/email
    { value: 'Autre', label: t('other') }
  ]

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)

  // Offered time slots follow the server's last-bookable rule (D-04)
  const [slots, setSlots] = useState<string[]>(() => bookableSlots({}))

  // Anti-bot (D-09): honeypot + time the form was first shown
  const [companyUrl, setCompanyUrl] = useState('')
  const startedAt = useRef<number | null>(null)

  // Consent (D-11/D-12): never pre-ticked
  const [marketingConsent, setMarketingConsent] = useState(false)

  const errorRef = useRef<HTMLDivElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Phone: country preselected from the locale (D-05)
  const defaultCountry = phoneCountryForLocale(locale)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(defaultCountry)
  const [localPhone, setLocalPhone] = useState('')

  const [form, setForm] = useState(EMPTY_FORM)

  const today = bangkokNow().date

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || !Array.isArray(json.data)) return
        const settings: SettingsMap = {}
        for (const row of json.data as { key: string; value: string }[]) {
          settings[row.key] = row.value
        }
        setSlots(bookableSlots(settings))
      })
      .catch(() => {
        // keep the default grid; the server stays the authority
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (errorKind) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [errorKind])

  useEffect(() => {
    if (success) successHeadingRef.current?.focus()
  }, [success])

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) ?? COUNTRIES[0]

  // Build E.164 from local input + country
  const fullPhone = useMemo<string>(() => {
    if (!localPhone.trim()) return ''
    try {
      return parsePhoneNumber(localPhone, selectedCountryCode).number
    } catch {
      const digits = localPhone.replace(/\D/g, '').replace(/^0+/, '')
      return selectedCountry.dialCode + digits
    }
  }, [localPhone, selectedCountryCode, selectedCountry.dialCode])

  // Is the local number valid for the selected country?
  const phoneIsValid = useMemo<boolean>(() => {
    if (!localPhone.trim()) return false
    try {
      return isValidPhoneNumber(localPhone, selectedCountryCode)
    } catch {
      return false
    }
  }, [localPhone, selectedCountryCode])

  const phoneShowError = localPhone.trim() !== '' && !phoneIsValid
  const emailShowError = emailTouched && form.customer_email.trim() !== '' && !isEmailValid(form.customer_email.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setErrorKind(null)
    setLoading(true)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          customer_phone: fullPhone,
          phone_country: selectedCountryCode,
          locale,
          marketing_consent: marketingConsent,
          company_url: companyUrl,
          form_started_at: startedAt.current ?? 0
        })
      })

      if (response.ok) {
        setSuccess(true)
        setForm(EMPTY_FORM)
        setLocalPhone('')
        setSelectedCountryCode(defaultCountry)
        setMarketingConsent(false)
        setCompanyUrl('')
        setEmailTouched(false)
        startedAt.current = Date.now()
      } else if (response.status === 429) {
        setErrorKind('rateLimited')
      } else {
        let code = ''
        try {
          const data = await response.json()
          code = typeof data?.code === 'string' ? data.code : ''
        } catch {
          // non-JSON error body
        }
        setErrorKind(CODE_TO_KIND[code] ?? 'genericError')
      }
    } catch {
      setErrorKind('networkError')
    } finally {
      setLoading(false)
    }
  }

  const lunchSlots = slots.filter((s) => s < '15:00')
  const dinnerSlots = slots.filter((s) => s >= '15:00')

  return (
    <div className="relative bg-gc-parchment border border-gc-aged p-8 sm:p-10 pb-24 sm:pb-10 shadow-sm">
      {/* Coins décoratifs */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold pointer-events-none" aria-hidden="true" />

      <div className="relative z-10">
        {success ? (
          <div className="text-center py-2" role="status">
            <div className="w-10 h-px bg-gc-gold mx-auto mb-6" />
            <h3
              ref={successHeadingRef}
              tabIndex={-1}
              className="font-cinzel font-normal text-[20px] text-gc-text-dark tracking-wide mb-4 outline-none"
            >
              {t('successTitle')}
            </h3>
            <p className="font-cormorant text-[17px] text-gc-text-mid mb-6 leading-normal">
              {t('successMessage')}
            </p>
            <p className="font-cormorant italic text-[14px] text-gc-text-mid mb-8">
              {t('successNote')}
            </p>
            <button
              onClick={() => setSuccess(false)}
              className={`px-6 py-3 min-h-11 ${primaryButtonClass}`}
            >
              {t('newReservation')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorKind && (
              <div
                ref={errorRef}
                role="alert"
                className="border-l-2 border-gc-copper p-4 bg-gc-copper/10"
              >
                <p className="font-cormorant text-[17px] text-gc-text-dark">{t(errorKind)}</p>
                {errorKind === 'rateLimited' && (
                  <a
                    href={buildWhatsAppUrl(getWhatsAppNumber(), tw('prefill'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-gc-jungle underline font-cormorant text-[17px]"
                  >
                    {t('rateLimitedWhatsapp')}
                  </a>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="res-name" className={labelClass}>
                  {t('fullName')}
                </label>
                <input
                  id="res-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.customer_name}
                  onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  className={inputClass}
                  placeholder={t('namePlaceholder')}
                />
              </div>

              {/* Phone with country selector */}
              <div className="space-y-2">
                <label htmlFor="res-phone" className={labelClass}>
                  {t('phone')}
                </label>

                <select
                  id="res-country"
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value as CountryCode)}
                  aria-label={t('countryLabel')}
                  className={`${selectClass} mb-2`}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-gc-ivory text-gc-text-dark">
                      {c.flag} {countryName(c.code)} ({c.dialCode})
                    </option>
                  ))}
                </select>

                {/* Dial code badge + input */}
                <div className="flex items-stretch">
                  <span className={[
                    'font-cormorant text-[17px] text-gc-text-mid border-b-2 pb-2 pt-2 pr-2 shrink-0 select-none',
                    phoneShowError ? 'border-gc-copper' : phoneIsValid ? 'border-gc-jungle' : 'border-gc-text-mid/35',
                  ].join(' ')}>
                    {selectedCountry.flag} {selectedCountry.dialCode}
                  </span>
                  <input
                    id="res-phone"
                    type="tel"
                    required
                    autoComplete="tel-national"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value)}
                    aria-invalid={phoneShowError}
                    aria-describedby={phoneShowError ? 'res-phone-hint' : undefined}
                    placeholder="812345678"
                    className={[
                      'flex-1 min-w-0 min-h-11 bg-transparent border-0 border-b-2 outline-none font-cormorant text-[17px] text-gc-text-dark placeholder:text-gc-text-mid/45 py-2 pl-2 transition-colors focus:ring-2 focus:ring-gc-jungle/25',
                      phoneShowError ? 'border-gc-copper' : phoneIsValid ? 'border-gc-jungle' : 'border-gc-text-mid/35 focus:border-gc-jungle',
                    ].join(' ')}
                  />
                </div>

                {phoneShowError && (
                  <p id="res-phone-hint" className={hintClass}>{t('phoneInvalid')}</p>
                )}
              </div>

              {/* Email (required, D-06) */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="res-email" className={labelClass}>
                  {t('email')}
                </label>
                <input
                  id="res-email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={form.customer_email}
                  onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailShowError}
                  aria-describedby={emailShowError ? 'res-email-hint' : undefined}
                  className={`${inputClass} ${emailShowError ? 'border-gc-copper' : ''}`}
                  placeholder={t('emailPlaceholder')}
                />
                {emailShowError && (
                  <p id="res-email-hint" className={hintClass}>{t('emailInvalid')}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label htmlFor="res-date" className={labelClass}>
                  {t('date')}
                </label>
                <input
                  id="res-date"
                  type="date"
                  required
                  min={today}
                  value={form.reservation_date}
                  onChange={(e) => setForm(f => ({ ...f, reservation_date: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label htmlFor="res-time" className={labelClass}>
                  {t('time')}
                </label>
                <select
                  id="res-time"
                  required
                  value={form.reservation_time}
                  onChange={(e) => setForm(f => ({ ...f, reservation_time: e.target.value }))}
                  className={selectClass}
                >
                  <option value="" className="bg-gc-ivory text-gc-text-dark">{t('selectTime')}</option>
                  {lunchSlots.length > 0 && (
                    <optgroup label={t('lunch')}>
                      {lunchSlots.map(time => (
                        <option key={time} value={time} className="bg-gc-ivory text-gc-text-dark">{time}</option>
                      ))}
                    </optgroup>
                  )}
                  {dinnerSlots.length > 0 && (
                    <optgroup label={t('dinnerLabel')}>
                      {dinnerSlots.map(time => (
                        <option key={time} value={time} className="bg-gc-ivory text-gc-text-dark">{time}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Party Size */}
              <div className="space-y-2" role="group" aria-labelledby="res-party-label">
                <span id="res-party-label" className={labelClass}>
                  {t('partySize')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, party_size: Math.max(1, f.party_size - 1) }))}
                    aria-label={t('partySizeDecrease')}
                    className="font-cinzel text-[20px] text-gc-text-dark border-2 border-gc-text-mid/40 w-11 h-11 flex items-center justify-center hover:bg-gc-jungle hover:text-gc-ivory hover:border-gc-jungle transition-all focus:outline-none focus:ring-2 focus:ring-gc-jungle"
                  >
                    −
                  </button>
                  <span className="font-cinzel text-[20px] text-gc-text-dark w-10 text-center" aria-live="polite">
                    {form.party_size}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, party_size: Math.min(MAX_PARTY_SIZE, f.party_size + 1) }))}
                    aria-label={t('partySizeIncrease')}
                    className="font-cinzel text-[20px] text-gc-text-dark border-2 border-gc-text-mid/40 w-11 h-11 flex items-center justify-center hover:bg-gc-jungle hover:text-gc-ivory hover:border-gc-jungle transition-all focus:outline-none focus:ring-2 focus:ring-gc-jungle"
                  >
                    +
                  </button>
                </div>
                {form.party_size > 10 && (
                  <p className={hintClass}>
                    {t('largeGroupWarning')}
                  </p>
                )}
              </div>

              {/* Occasion */}
              <div className="space-y-2">
                <label htmlFor="res-occasion" className={labelClass}>
                  {t('occasion')}
                </label>
                <select
                  id="res-occasion"
                  value={form.occasion}
                  onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))}
                  className={selectClass}
                >
                  {OCCASIONS.map(occ => (
                    <option key={occ.value} value={occ.value} className="bg-gc-ivory text-gc-text-dark">{occ.label}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Honeypot (D-09): off-screen, never display:none */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
            </div>

            {/* Marketing consent (D-11/D-12): optional, unticked by default */}
            <div>
              <label htmlFor="res-consent" className="min-h-11 flex items-start gap-2 py-2 font-cormorant text-[14px] text-gc-text-dark cursor-pointer">
                <input
                  id="res-consent"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="accent-gc-jungle w-5 h-5 mt-0.5 shrink-0"
                />
                <span>
                  {t.rich('marketingConsent', {
                    link: (chunks) => (
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gc-jungle underline hover:text-gc-void"
                      >
                        {chunks}
                      </Link>
                    )
                  })}
                </span>
              </label>
            </div>

            <button
              id="reservation-submit"
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={`w-full py-4 min-h-12 flex items-center justify-center gap-3 ${primaryButtonClass}`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  {t('sending')}
                </>
              ) : (
                t('submit')
              )}
            </button>

            <p className="text-center font-cormorant italic text-[14px] text-gc-text-mid">
              {t('required')}
            </p>
            <p className="text-center font-cormorant italic text-[14px] text-gc-text-mid">
              {t('privacyNote')}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
