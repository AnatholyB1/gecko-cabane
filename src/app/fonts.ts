import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond, Raleway } from 'next/font/google'
import { SITE_URL } from '@/utils/seo'

// Shared by the two root layouts ([locale]/layout.tsx and admin/layout.tsx). There is no
// app/layout.tsx any more: the root layout reading the locale through headers() made every
// public page dynamic (Cache-Control private, no-cache, no-store).
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

const cinzelDecorative = Cinzel_Decorative({
  variable: '--font-cinzel-decorative',
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
  weight: ['300', '400'],
  display: 'swap',
})

export const BODY_CLASS = `${cinzel.variable} ${cinzelDecorative.variable} ${cormorant.variable} ${raleway.variable} antialiased`

export const ROOT_METADATA: Metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  authors: [{ name: 'Gecko Cabane Restaurant' }],
  creator: 'selenium-studio.com',
  publisher: 'Gecko Cabane Restaurant',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'restaurant',
}
