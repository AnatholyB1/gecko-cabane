import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import FloatingContact from '@/components/FloatingContact'
import PlausibleScript from '@/components/PlausibleScript'
import AttributionCapture from '@/components/AttributionCapture'
import NewsletterPopup from '@/components/NewsletterPopupLazy'
import { LOCALES, OG_LOCALE, type SeoLocale } from '@/utils/seo'
import { CLIENT_NAMESPACES, pickMessages } from '@/utils/client-messages'
import { BODY_CLASS, ROOT_METADATA } from '../fonts'
import '../globals.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: SeoLocale = (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
  const t = await getTranslations({ locale, namespace: 'meta' })

  // Metadata merging is shallow: each page owns its own URL and language links.
  return {
    ...ROOT_METADATA,
    title: { default: t('homeTitle'), template: '%s | Gecko Cabane' },
    description: t('homeDescription'),
    openGraph: {
      siteName: 'Gecko Cabane',
      locale: OG_LOCALE[locale],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Static rendering: the locale comes from the URL segment, never from the request headers.
  setRequestLocale(locale)

  // Get messages for the locale
  // Only the namespaces read by Client Components travel to the browser (PERF-04).
  const messages = pickMessages(await getMessages({ locale }), CLIENT_NAMESPACES)

  // Root layout of the public site (no app/layout.tsx): <html lang> is known at build time.
  return (
    <html lang={locale}>
      <body className={BODY_CLASS}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <PlausibleScript />
          <AttributionCapture />
          <FloatingContact />
          <NewsletterPopup />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// Unknown values such as "apple-touch-icon-precomposed.png" (iOS icon probe; the matcher skips .png so the
// middleware never sees it) must 404 before layout and page render in parallel (Sentry GECKO-CABANE-S).
export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
