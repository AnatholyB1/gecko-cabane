'use client'

import { useState, useEffect } from 'react'
import type { Announcement } from '@/types/database'

const BG_CLASSES: Record<string, string> = {
  amber: 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 text-amber-900',
  green: 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-900',
  red: 'bg-gradient-to-r from-red-100 to-rose-100 border-red-300 text-red-900',
  blue: 'bg-gradient-to-r from-blue-100 to-sky-100 border-blue-300 text-blue-900',
  purple: 'bg-gradient-to-r from-purple-100 to-violet-100 border-purple-300 text-purple-900',
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
    <div className={`relative py-4 px-6 border-b-2 ${bgClasses}`}>
      <div className="max-w-4xl mx-auto text-center">
        {announcement.title && (
          <p className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
            <span>📢</span> {announcement.title}
          </p>
        )}
        <p className="whitespace-pre-wrap">{announcement.content}</p>
        {(announcement.start_date || announcement.end_date) && (
          <p className="text-sm mt-2 opacity-70">
            {announcement.start_date && `Du ${new Date(announcement.start_date).toLocaleDateString('fr-FR')}`}
            {announcement.start_date && announcement.end_date && ' '}
            {announcement.end_date && `au ${new Date(announcement.end_date).toLocaleDateString('fr-FR')}`}
          </p>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-4 p-1 hover:opacity-70 transition-opacity"
        aria-label="Fermer l'annonce"
      >
        ✕
      </button>
    </div>
  )
}
