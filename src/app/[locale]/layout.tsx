import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import WhatsAppButton from '@/components/WhatsAppButton'
import { LOCALES, OG_LOCALE, type SeoLocale } from '@/utils/seo'

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

  // Get messages for the locale
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <WhatsAppButton />
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
