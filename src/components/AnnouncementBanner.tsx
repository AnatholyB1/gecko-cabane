'use client'

import { useState, useEffect } from 'react'
import type { Announcement } from '@/types/database'

// Colonial palette — toutes variantes mappées sur gc-jungle + bordure or
const BG_CLASSES: Record<string, string> = {
  amber:  'bg-(--gc-jungle) border-(--gc-gold) text-(--gc-ivory)',
  green:  'bg-(--gc-jungle) border-(--gc-gold) text-(--gc-ivory)',
  red:    'bg-(--gc-jungle) border-(--gc-gold) text-(--gc-ivory)',
  blue:   'bg-(--gc-jungle) border-(--gc-gold) text-(--gc-ivory)',
  purple: 'bg-(--gc-jungle) border-(--gc-gold) text-(--gc-ivory)',
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const response = await fetch('/api/announcement')
        const data = await response.json()
        
        if (data.data && data.data.is_active && data.data.content) {
          // Check date range
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const startDate = data.data.start_date ? new Date(data.data.start_date) : null
          const endDate = data.data.end_date ? new Date(data.data.end_date) : null
          
          // If start_date exists and is in the future, don't show
          if (startDate && startDate > today) {
            return
          }
          
          // If end_date exists and is in the past, don't show
          if (endDate && endDate < today) {
            return
          }
          
          setAnnouncement(data.data)
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnnouncement()
  }, [])

  if (loading || !announcement || !visible) {
    return null
  }

  const bgClasses = BG_CLASSES[announcement.bg_color] || BG_CLASSES.amber

  return (
    <div className={`relative py-3 px-6 border-b ${bgClasses}`} style={{ borderColor: 'var(--gc-gold)', borderBottomWidth: '1px' }}>
      <div className="max-w-4xl mx-auto text-center">
        {announcement.title && (
          <p
            className="mb-1 tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-cinzel)', fontSize: '12px', color: 'var(--gc-gold)', letterSpacing: '0.2em' }}
          >
            {announcement.title}
          </p>
        )}
        <p
          className="whitespace-pre-wrap"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', color: 'var(--gc-ivory)', lineHeight: '1.6' }}
        >
          {announcement.content}
        </p>
        {(announcement.start_date || announcement.end_date) && (
          <p
            className="mt-2"
            style={{ fontFamily: 'var(--font-raleway)', fontSize: '11px', color: 'var(--gc-gold)', opacity: 0.7, letterSpacing: '0.1em' }}
          >
            {announcement.start_date && `Du ${new Date(announcement.start_date).toLocaleDateString('fr-FR')}`}
            {announcement.start_date && announcement.end_date && ' '}
            {announcement.end_date && `au ${new Date(announcement.end_date).toLocaleDateString('fr-FR')}`}
          </p>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute top-1/2 -translate-y-1/2 right-4 transition-opacity hover:opacity-60"
        aria-label="Fermer l'annonce"
        style={{ fontFamily: 'var(--font-cinzel)', fontSize: '14px', color: 'var(--gc-gold)' }}
      >
        ✕
      </button>
    </div>
  )
}
