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
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-primary-dark mb-4">
          {t('successTitle')}
        </h3>
        <p className="text-warm-gray mb-6">
          {t('successMessage')}
        </p>
        <p className="text-sm text-primary">
          {t('successNote')}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors"
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-primary-dark mb-6 text-center">
        🦎 {t('title')}
      </h3>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('fullName')}
          </label>
          <input
            type="text"
            required
            value={form.customer_name}
            onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
            placeholder="Jean Dupont"
          />
        </div>

        {/* Phone with country selector */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('phone')}
          </label>

          {/* Country selector */}
          <select
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={phoneVerifState === 'verified'}
            aria-label={t('countryLabel')}
            className="w-full px-4 py-2 mb-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20 bg-white text-sm disabled:bg-gray-50 disabled:text-gray-500"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>

          {/* Dial code badge + input + action — all flush in one row */}
          <div className="flex items-stretch">
            <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-sm font-mono text-gray-600 whitespace-nowrap select-none">
              {selectedCountry.flag} {selectedCountry.dialCode}
            </span>

            <input
              type="tel"
              required
              value={localPhone}
              onChange={(e) => handleLocalPhoneChange(e.target.value)}
              disabled={phoneVerifState === 'verified'}
              placeholder="812345678"
              className={`min-w-0 flex-1 px-3 py-3 border border-gray-200 focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                localPhone && !phoneIsValid
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : phoneIsValid
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
                  : 'focus:border-primary focus:ring-(--primary)/20'
              } ${phoneVerifState === 'verified' ? 'rounded-r-lg' : 'rounded-none'}`}
            />

            {phoneVerifState !== 'verified' && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendDisabled}
                className="shrink-0 px-3 py-3 bg-primary text-white rounded-r-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-l-0 border-primary"
              >
                {phoneVerifState === 'sending' ? (
                  <span className="flex items-center justify-center w-20">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  </span>
                ) : (
                  <span className="w-20 inline-block text-center whitespace-nowrap">
                    {phoneVerifState === 'sent' ? t('otpResend') : t('otpSend')}
                  </span>
                )}
              </button>
            )}

            {phoneVerifState === 'verified' && (
              <button
                type="button"
                onClick={resetVerification}
                className="shrink-0 flex items-center gap-1 px-3 text-sm text-green-700 bg-green-50 border border-l-0 border-green-300 rounded-r-lg hover:bg-green-100 transition-colors whitespace-nowrap"
              >
                ✅ {t('otpVerified')}
                <span className="text-xs text-gray-400 ml-1">{t('otpChange')}</span>
              </button>
            )}
          </div>

          {/* Phone validation hint */}
          {localPhone && !phoneIsValid && phoneVerifState === 'idle' && (
            <p className="mt-1 text-xs text-red-500">{t('otpInvalidPhone')}</p>
          )}

          {/* OTP input block */}
          {(phoneVerifState === 'sent' || phoneVerifState === 'verifying') && (
            <div className="mt-3 p-4 bg-accent-light rounded-lg border border-(--primary)/20">
              <p className="text-sm text-primary-dark mb-2">
                📱 {t('otpSentTo')} <strong>{fullPhone}</strong>
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
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20 text-center text-xl tracking-[0.5em] font-mono"
                />
                <button
                  type="button"
                  onClick={checkOtp}
                  disabled={phoneVerifState === 'verifying' || otpCode.length < 6}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phoneVerifState === 'verifying' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block" />
                  ) : t('otpVerify')}
                </button>
              </div>
              {otpError && (
                <p className="mt-2 text-red-600 text-sm">{otpError}</p>
              )}
              <p className="mt-2 text-xs text-warm-gray">{t('otpExpiry')}</p>
            </div>
          )}

          {/* Error in idle state */}
          {phoneVerifState === 'idle' && otpError && (
            <p className="mt-1 text-red-600 text-sm">{otpError}</p>
          )}
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('email')}
          </label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
            placeholder="jean@example.com"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('date')}
          </label>
          <input
            type="date"
            required
            min={today}
            value={form.reservation_date}
            onChange={(e) => setForm(f => ({ ...f, reservation_date: e.target.value }))}
            aria-label={t('date')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('time')}
          </label>
          <select
            required
            value={form.reservation_time}
            onChange={(e) => setForm(f => ({ ...f, reservation_time: e.target.value }))}
            aria-label={t('time')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
          >
            <option value="">{t('selectTime')}</option>
            <optgroup label={t('lunch')}>
              {TIME_SLOTS.filter(t => t < '15:00').map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </optgroup>
            <optgroup label={t('dinnerLabel')}>
              {TIME_SLOTS.filter(t => t >= '15:00').map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Party Size */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('partySize')}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.max(1, f.party_size - 1) }))}
              className="w-10 h-10 rounded-full bg-accent-light text-primary-dark font-bold hover:bg-(--moss)/30"
            >
              -
            </button>
            <span className="text-2xl font-bold text-primary-dark w-12 text-center">
              {form.party_size}
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.min(20, f.party_size + 1) }))}
              className="w-10 h-10 rounded-full bg-accent-light text-primary-dark font-bold hover:bg-(--moss)/30"
            >
              +
            </button>
          </div>
          {form.party_size > 10 && (
            <p className="text-amber-600 text-sm mt-2">
              {t('largeGroupWarning')}
            </p>
          )}
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            {t('occasion')}
          </label>
          <select
            value={form.occasion}
            onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))}
            aria-label={t('occasion')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
          >
            {OCCASIONS.map(occ => (
              <option key={occ.value} value={occ.value}>{occ.label}</option>
            ))}
          </select>
        </div>

      </div>

      <button
        type="submit"
        disabled={loading || phoneVerifState !== 'verified'}
        className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
            {t('sending')}
          </span>
        ) : (
          t('submit')
        )}
      </button>

      {phoneVerifState !== 'verified' && (
        <p className="text-center text-sm text-amber-600 mt-3">
          📱 {t('otpRequired')}
        </p>
      )}

      <p className="text-center text-sm text-warm-gray mt-4">
        {t('required')}
      </p>
    </form>
  )
}
