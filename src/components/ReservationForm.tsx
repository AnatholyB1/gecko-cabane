'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js'

type PhoneVerifState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'

interface Country {
  code: CountryCode
  dialCode: string
  name: string
  flag: string
}

// Most common nationalities at Krabi, ordered by frequency
const COUNTRIES: Country[] = [
  { code: 'TH', dialCode: '+66',  name: 'Thaïlande / Thailand',           flag: '🇹🇭' },
  { code: 'FR', dialCode: '+33',  name: 'France',                          flag: '🇫🇷' },
  { code: 'GB', dialCode: '+44',  name: 'Royaume-Uni / UK',                flag: '🇬🇧' },
  { code: 'DE', dialCode: '+49',  name: 'Allemagne / Germany',             flag: '🇩🇪' },
  { code: 'US', dialCode: '+1',   name: 'États-Unis / USA',                flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1',   name: 'Canada',                          flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61',  name: 'Australie / Australia',           flag: '🇦🇺' },
  { code: 'NZ', dialCode: '+64',  name: 'Nouvelle-Zélande / New Zealand',  flag: '🇳🇿' },
  { code: 'SG', dialCode: '+65',  name: 'Singapour / Singapore',           flag: '🇸🇬' },
  { code: 'MY', dialCode: '+60',  name: 'Malaisie / Malaysia',             flag: '🇲🇾' },
  { code: 'CN', dialCode: '+86',  name: 'Chine / China',                   flag: '🇨🇳' },
  { code: 'JP', dialCode: '+81',  name: 'Japon / Japan',                   flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82',  name: 'Corée du Sud / South Korea',      flag: '🇰🇷' },
  { code: 'IN', dialCode: '+91',  name: 'Inde / India',                    flag: '🇮🇳' },
  { code: 'RU', dialCode: '+7',   name: 'Russie / Russia',                 flag: '🇷🇺' },
  { code: 'SE', dialCode: '+46',  name: 'Suède / Sweden',                  flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47',  name: 'Norvège / Norway',                flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45',  name: 'Danemark / Denmark',              flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', name: 'Finlande / Finland',              flag: '🇫🇮' },
  { code: 'NL', dialCode: '+31',  name: 'Pays-Bas / Netherlands',          flag: '🇳🇱' },
  { code: 'BE', dialCode: '+32',  name: 'Belgique / Belgium',              flag: '🇧🇪' },
  { code: 'CH', dialCode: '+41',  name: 'Suisse / Switzerland',            flag: '🇨🇭' },
  { code: 'ES', dialCode: '+34',  name: 'Espagne / Spain',                 flag: '🇪🇸' },
  { code: 'IT', dialCode: '+39',  name: 'Italie / Italy',                  flag: '🇮🇹' },
  { code: 'PT', dialCode: '+351', name: 'Portugal',                        flag: '🇵🇹' },
  { code: 'PL', dialCode: '+48',  name: 'Pologne / Poland',                flag: '🇵🇱' },
  { code: 'VN', dialCode: '+84',  name: 'Vietnam',                         flag: '🇻🇳' },
  { code: 'AE', dialCode: '+971', name: 'Émirats arabes unis / UAE',       flag: '🇦🇪' },
  { code: 'IL', dialCode: '+972', name: 'Israël / Israel',                 flag: '🇮🇱' },
  { code: 'ZA', dialCode: '+27',  name: 'Afrique du Sud / South Africa',   flag: '🇿🇦' },
]

export default function ReservationForm() {
  const t = useTranslations('reservationForm')
  
  const OCCASIONS = [
    { value: '', label: t('selectOptional') },
    { value: 'Anniversaire', label: t('birthday') },
    { value: 'Dîner romantique', label: t('romanticDinner') },
    { value: 'Repas d\'affaires', label: t('businessMeal') },
    { value: 'Célébration', label: t('celebration') },
    { value: 'Autre', label: t('other') }
  ]

  const TIME_SLOTS = [
    '11:30', '12:00', '12:30', '13:00', '13:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ]

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Phone / OTP state
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>('TH')
  const [localPhone, setLocalPhone] = useState('')
  const [phoneVerifState, setPhoneVerifState] = useState<PhoneVerifState>('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    reservation_date: '',
    reservation_time: '',
    party_size: 2,
    occasion: ''
  })

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

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

  function resetVerification() {
    setPhoneVerifState('idle')
    setOtpCode('')
    setOtpError(null)
    setVerificationToken(null)
  }

  function handleCountryChange(code: string) {
    setSelectedCountryCode(code as CountryCode)
    resetVerification()
  }

  function handleLocalPhoneChange(value: string) {
    setLocalPhone(value)
    if (phoneVerifState !== 'idle') resetVerification()
  }

  async function sendOtp() {
    setOtpError(null)
    if (!phoneIsValid) {
      setOtpError(t('otpInvalidPhone'))
      return
    }
    setPhoneVerifState('sending')
    try {
      const res = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      })
      const data = await res.json()
      if (res.ok) {
        setPhoneVerifState('sent')
      } else {
        setOtpError(data.error ?? t('otpSendError'))
        setPhoneVerifState('idle')
      }
    } catch {
      setOtpError(t('otpSendError'))
      setPhoneVerifState('idle')
    }
  }

  async function checkOtp() {
    setOtpError(null)
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError(t('otpFormat'))
      return
    }
    setPhoneVerifState('verifying')
    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: otpCode })
      })
      const data = await res.json()
      if (res.ok) {
        setVerificationToken(data.token)
        setPhoneVerifState('verified')
      } else {
        setOtpError(data.error ?? t('otpCheckError'))
        setPhoneVerifState('sent')
      }
    } catch {
      setOtpError(t('otpCheckError'))
      setPhoneVerifState('sent')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phoneVerifState !== 'verified' || !verificationToken) {
      setError(t('otpRequired'))
      return
    }
    setError(null)
    setLoading(true)
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          customer_phone: fullPhone,
          phone_verification_token: verificationToken
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setForm({
          customer_name: '',
          customer_email: '',
          reservation_date: '',
          reservation_time: '',
          party_size: 2,
          occasion: ''
        })
        setLocalPhone('')
        setSelectedCountryCode('TH')
        resetVerification()
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="border border-gc-gold/30 p-10 text-center">
        <div className="w-10 h-px bg-gc-gold mx-auto mb-6" />
        <h3 className="font-cinzel font-normal text-[20px] text-gc-ivory tracking-wide mb-4">
          {t('successTitle')}
        </h3>
        <p className="font-cormorant text-[17px] text-gc-ivory/70 mb-6 leading-relaxed">
          {t('successMessage')}
        </p>
        <p className="font-cormorant italic text-[15px] text-gc-gold/70 mb-8">
          {t('successNote')}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-6 py-3 hover:bg-gc-gold hover:text-gc-void transition-all"
        >
          {t('newReservation')}
        </button>
      </div>
    )
  }

  const sendDisabled =
    phoneVerifState === 'sending' ||
    phoneVerifState === 'sent' ||
    phoneVerifState === 'verifying' ||
    !phoneIsValid

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border-l-2 border-gc-copper p-4 bg-gc-copper/5">
          <p className="font-cormorant text-[16px] text-gc-ivory/80">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="res-name" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('fullName')}
          </label>
          <input
            id="res-name"
            type="text"
            required
            autoComplete="name"
            value={form.customer_name}
            onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 transition-colors"
            placeholder="Jean Dupont"
          />
        </div>

        {/* Phone with country selector */}
        <div className="space-y-2">
          <label htmlFor="res-phone" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('phone')}
          </label>

          {/* Country selector */}
          <select
            id="res-country"
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={phoneVerifState === 'verified'}
            aria-label={t('countryLabel')}
            className="w-full border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[15px] text-gc-ivory py-2 mb-2 disabled:opacity-50 transition-colors"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} className="bg-gc-void text-gc-ivory">
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>

          {/* Dial code badge + input + action */}
          <div className="flex items-stretch gap-0">
            <span className="font-cormorant text-[15px] text-gc-ivory/50 border-b border-gc-gold/30 pb-2 pr-2 shrink-0 select-none">
              {selectedCountry.flag} {selectedCountry.dialCode}
            </span>
            <input
              id="res-phone"
              type="tel"
              required
              autoComplete="tel"
              value={localPhone}
              onChange={(e) => handleLocalPhoneChange(e.target.value)}
              disabled={phoneVerifState === 'verified'}
              placeholder="812345678"
              className={[
                'flex-1 bg-transparent border-0 border-b outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 pl-2 transition-colors disabled:opacity-50',
                localPhone && !phoneIsValid ? 'border-gc-copper' : phoneIsValid ? 'border-gc-celadon' : 'border-gc-gold/30 focus:border-gc-gold',
              ].join(' ')}
            />
            {phoneVerifState !== 'verified' && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendDisabled}
                className="shrink-0 font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-gold border-b border-gc-gold px-3 py-2 hover:text-gc-void hover:bg-gc-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {phoneVerifState === 'sending' ? (
                  <span className="w-12 inline-flex justify-center">
                    <span className="w-3 h-3 border border-gc-gold border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : (
                  <span className="w-12 inline-block text-center">
                    {phoneVerifState === 'sent' ? t('otpResend') : t('otpSend')}
                  </span>
                )}
              </button>
            )}
            {phoneVerifState === 'verified' && (
              <button
                type="button"
                onClick={resetVerification}
                className="shrink-0 font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-celadon border-b border-gc-celadon px-3 py-2 hover:opacity-70 transition-opacity"
              >
                {t('otpVerified')}
              </button>
            )}
          </div>

          {/* Phone validation hint */}
          {localPhone && !phoneIsValid && phoneVerifState === 'idle' && (
            <p className="font-cormorant italic text-[14px] text-gc-copper">{t('otpInvalidPhone')}</p>
          )}

          {/* OTP input block */}
          {(phoneVerifState === 'sent' || phoneVerifState === 'verifying') && (
            <div className="mt-3 p-4 border border-gc-gold/20">
              <p className="font-cormorant text-[15px] text-gc-ivory/70 mb-3">
                {t('otpSentTo')} <strong className="text-gc-gold">{fullPhone}</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  aria-label="Code OTP"
                  className="flex-1 bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[20px] text-gc-ivory text-center tracking-[0.5em] py-2 transition-colors"
                />
                <button
                  type="button"
                  onClick={checkOtp}
                  disabled={phoneVerifState === 'verifying' || otpCode.length < 6}
                  className="shrink-0 font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-gold border border-gc-gold px-4 py-2 hover:bg-gc-gold hover:text-gc-void transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {phoneVerifState === 'verifying' ? (
                    <span className="w-3 h-3 border border-gc-gold border-t-transparent rounded-full animate-spin inline-block" />
                  ) : t('otpVerify')}
                </button>
              </div>
              {otpError && (
                <p className="mt-2 font-cormorant italic text-[14px] text-gc-copper">{otpError}</p>
              )}
              <p className="mt-2 font-cormorant italic text-[13px] text-gc-ivory/40">{t('otpExpiry')}</p>
            </div>
          )}

          {/* Error in idle state */}
          {phoneVerifState === 'idle' && otpError && (
            <p className="font-cormorant italic text-[14px] text-gc-copper">{otpError}</p>
          )}
        </div>

        {/* Email */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="res-email" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('email')}
          </label>
          <input
            id="res-email"
            type="email"
            autoComplete="email"
            value={form.customer_email}
            onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 transition-colors"
            placeholder="jean@example.com"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label htmlFor="res-date" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('date')}
          </label>
          <input
            id="res-date"
            type="date"
            required
            min={today}
            value={form.reservation_date}
            onChange={(e) => setForm(f => ({ ...f, reservation_date: e.target.value }))}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors"
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label htmlFor="res-time" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('time')}
          </label>
          <select
            id="res-time"
            required
            value={form.reservation_time}
            onChange={(e) => setForm(f => ({ ...f, reservation_time: e.target.value }))}
            className="w-full border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors"
          >
            <option value="" className="bg-gc-void">{t('selectTime')}</option>
            <optgroup label={t('lunch')}>
              {TIME_SLOTS.filter(t => t < '15:00').map(time => (
                <option key={time} value={time} className="bg-gc-void">{time}</option>
              ))}
            </optgroup>
            <optgroup label={t('dinnerLabel')}>
              {TIME_SLOTS.filter(t => t >= '15:00').map(time => (
                <option key={time} value={time} className="bg-gc-void">{time}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Party Size */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('partySize')}
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.max(1, f.party_size - 1) }))}
              className="font-cinzel text-[18px] text-gc-gold border border-gc-gold/40 w-9 h-9 flex items-center justify-center hover:bg-gc-gold hover:text-gc-void transition-all"
            >
              −
            </button>
            <span className="font-cinzel text-[22px] text-gc-ivory w-10 text-center">
              {form.party_size}
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.min(20, f.party_size + 1) }))}
              className="font-cinzel text-[18px] text-gc-gold border border-gc-gold/40 w-9 h-9 flex items-center justify-center hover:bg-gc-gold hover:text-gc-void transition-all"
            >
              +
            </button>
          </div>
          {form.party_size > 10 && (
            <p className="font-cormorant italic text-[14px] text-gc-gold/70">
              {t('largeGroupWarning')}
            </p>
          )}
        </div>

        {/* Occasion */}
        <div className="space-y-2">
          <label htmlFor="res-occasion" className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('occasion')}
          </label>
          <select
            id="res-occasion"
            value={form.occasion}
            onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))}
            className="w-full border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors"
          >
            {OCCASIONS.map(occ => (
              <option key={occ.value} value={occ.value} className="bg-gc-void">{occ.label}</option>
            ))}
          </select>
        </div>

      </div>

      <button
        type="submit"
        disabled={loading || phoneVerifState !== 'verified'}
        className="w-full mt-6 font-cinzel text-[13px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold py-4 hover:bg-gc-gold hover:text-gc-void transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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

      {phoneVerifState !== 'verified' && (
        <p className="text-center font-cormorant italic text-[14px] text-gc-gold/60 mt-3">
          {t('otpRequired')}
        </p>
      )}

      <p className="text-center font-cormorant italic text-[14px] text-gc-ivory/35 mt-4">
        {t('required')}
      </p>
    </form>
  )
}
