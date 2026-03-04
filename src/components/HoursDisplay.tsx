'use client'

import { useState, useEffect } from 'react'
import type { OpeningHours, SpecialHours } from '@/types/database'

const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function HoursDisplay() {
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

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-t-4 border-[var(--tropical)]">
        <div className="animate-pulse space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  // Fallback to static hours if database is empty
  const displayHours = hours.length > 0 ? hours : [
    { day_of_week: 1, day_name: 'Lundi', is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 2, day_name: 'Mardi', is_open: false, open_time: null, close_time: null },
    { day_of_week: 3, day_name: 'Mercredi', is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 4, day_name: 'Jeudi', is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 5, day_name: 'Vendredi', is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 6, day_name: 'Samedi', is_open: true, open_time: '11:00', close_time: '23:00' },
    { day_of_week: 0, day_name: 'Dimanche', is_open: true, open_time: '11:00', close_time: '23:00' },
  ] as OpeningHours[]

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-t-4 border-[var(--tropical)]">
      <div className="grid gap-4">
        {displayHours.map((item, i) => (
          <div 
            key={i} 
            className={`flex justify-between items-center p-4 rounded-xl ${
              item.is_open 
                ? "bg-[var(--accent-light)]/50" 
                : "bg-red-50"
            }`}
          >
            <span className="font-semibold text-[var(--primary-dark)]">
              {item.day_name || DAY_ORDER[item.day_of_week === 0 ? 6 : item.day_of_week - 1]}
            </span>
            <span className={`font-[family-name:var(--font-lora)] ${
              item.is_open ? "text-[var(--warm-green)]" : "text-red-500"
            }`}>
              {item.is_open 
                ? `${formatTime(item.open_time)} - ${formatTime(item.close_time)}` 
                : 'Fermé'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Special Hours Section */}
      {specialHours.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <h4 className="font-bold text-xl text-amber-800 mb-4 flex items-center gap-2">
            <span>📅</span> Horaires spéciaux à venir
          </h4>
          <div className="space-y-4">
            {specialHours.map((sh) => (
              <div 
                key={sh.id} 
                className={`p-4 rounded-xl ${
                  sh.is_open 
                    ? 'bg-white border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold text-[var(--primary-dark)]">
                      {new Date(sh.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {sh.title && (
                      <p className="text-amber-700 font-medium mt-1">
                        🎉 {sh.title}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sh.is_open 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {sh.is_open 
                      ? `${formatTime(sh.open_time)} - ${formatTime(sh.close_time)}` 
                      : 'Fermé'}
                  </span>
                </div>
                {sh.note && (
                  <p className="mt-3 text-[var(--warm-gray)] text-sm italic border-t border-gray-100 pt-3">
                    💬 {sh.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-[var(--warm-gold)]/20 rounded-xl text-center">
        <p className="text-[var(--primary-dark)] font-[family-name:var(--font-lora)]">
          ⏰ Dernière commande en cuisine : <strong>22h00</strong>
        </p>
      </div>
    </div>
  )
}
