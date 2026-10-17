'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/utils/attribution'

export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
