'use client'

import dynamic from 'next/dynamic'

// The pop-up renders nothing until a trigger fires (timer, scroll, exit intent), so its code and the
// NewsletterForm it embeds are fetched after the page is interactive instead of blocking it (PERF-03).
const NewsletterPopup = dynamic(() => import('@/components/NewsletterPopup'), { ssr: false })

export default function NewsletterPopupLazy() {
  return <NewsletterPopup />
}
