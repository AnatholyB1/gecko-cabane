'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { OpeningHours, SpecialHours } from '@/types/database'

export default function HoursDisplay() {
  const t = useTranslations('hours')
  const locale = useLocale()
  
  const DAY_NAMES = [
    t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday'), t('sunday')
  ]

  const [hours, setHours] = useState<OpeningHours[]>([])
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHours() {
      try {
        const [hoursRes, specialRes] = await Promise.all([
          fetch('/api/hours'),
          fetch('/api/special-hours')
        ])
        
        const hoursData = await hoursRes.json()
        const specialData = await specialRes.json()
        
        if (hoursData.data) {
          // Sort by day order (Monday first)
          const sorted = [...hoursData.data].sort((a, b) => {
            // Convert Sunday (0) to 7 for sorting Monday first
            const dayA = a.day_of_week === 0 ? 7 : a.day_of_week
            const dayB = b.day_of_week === 0 ? 7 : b.day_of_week
            return dayA - dayB
          })
          setHours(sorted)
        }
        if (specialData.data) {
          // Filter to show only upcoming special hours (next 90 days)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
          const upcoming = specialData.data.filter((sh: SpecialHours) => {
            const date = new Date(sh.date)
            return date >= today && date <= ninetyDaysLater
          })
          setSpecialHours(upcoming)
        }
      } catch (error) {
        console.error('Error fetching hours:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHours()
  }, [])

  function formatTime(time: string | null): string {
    if (!time) return ''
    // Convert "HH:MM:SS" to "HH:MM"
    return time.slice(0, 5)
  }
  
  function getDayName(dayOfWeek: number): string {
    // dayOfWeek: 0 = Sunday, 1 = Monday, etc.
    // DAY_NAMES: 0 = Monday, 1 = Tuesday, etc.
    if (dayOfWeek === 0) return DAY_NAMES[6] // Sunday
    return DAY_NAMES[dayOfWeek - 1]
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-10 bg-gc-aged/30 animate-pulse" />
        ))}
      </div>
    )
  }

  // Fallback to static hours if database is empty
  const displayHours = hours.length > 0 ? hours : [
    { day_of_week: 1, day_name: DAY_NAMES[0], is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 2, day_name: DAY_NAMES[1], is_open: false, open_time: null, close_time: null },
    { day_of_week: 3, day_name: DAY_NAMES[2], is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 4, day_name: DAY_NAMES[3], is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 5, day_name: DAY_NAMES[4], is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 6, day_name: DAY_NAMES[5], is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 0, day_name: DAY_NAMES[6], is_open: true, open_time: '11:00', close_time: '23:00' },
  ] as OpeningHours[]

  return (
    <div>
      <div className="divide-y divide-gc-aged/50">
        {displayHours.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-4"
          >
            <span className="font-cinzel font-normal text-[14px] tracking-[0.1em] uppercase text-gc-text-dark">
              {item.day_name || getDayName(item.day_of_week)}
            </span>
            <span className={`font-cormorant text-[17px] ${
              item.is_open ? 'text-gc-text-dark' : 'text-gc-copper italic'
            }`}>
              {item.is_open
                ? `${formatTime(item.open_time)} — ${formatTime(item.close_time)}`
                : t('closed')}
            </span>
          </div>
        ))}
      </div>

      {/* Special Hours Section */}
      {specialHours.length > 0 && (
        <div className="mt-8 space-y-3">
          <h4 className="font-cinzel font-normal text-[13px] tracking-[0.2em] uppercase text-gc-brass mb-4">
            {t('specialHours')}
          </h4>
          {specialHours.map((sh) => (
            <div
              key={sh.id}
              className="border-l-2 border-gc-gold pl-4 py-2"
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="font-cinzel font-normal text-[13px] tracking-wide text-gc-text-dark">
                    {new Date(sh.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {sh.title && (
                    <p className="font-cormorant italic text-[15px] text-gc-brass mt-1">
                      {sh.title}
                    </p>
                  )}
                </div>
                <span className={`font-cormorant text-[16px] ${
                  sh.is_open ? 'text-gc-text-dark' : 'text-gc-copper italic'
                }`}>
                  {sh.is_open
                    ? `${formatTime(sh.open_time)} — ${formatTime(sh.close_time)}`
                    : t('closed')}
                </span>
              </div>
              {sh.note && (
                <p className="font-cormorant italic text-[14px] text-gc-text-mid mt-2">
                  {sh.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-5 border-t border-gc-aged text-center">
        <p className="font-cormorant italic text-[16px] text-gc-text-mid">
          {t('lastOrder')} : <span className="font-cinzel not-italic text-gc-text-dark">22h00</span>
        </p>
      </div>
    </div>
  )
}
