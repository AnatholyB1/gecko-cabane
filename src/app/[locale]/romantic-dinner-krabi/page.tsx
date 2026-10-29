import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { localizedPageMetadata } from '@/utils/page-metadata'
import { PAGES, toSeoLocale, type SeoLocale } from '@/utils/seo'
import SeoLandingPage from '@/components/seo/SeoLandingPage'

type Props = {
  params: Promise<{ locale: string }>
}

const KEY = '/romantic-dinner-krabi'

function hasContent(locale: SeoLocale): boolean {
  return PAGES.find((p) => p.key === KEY)!.contentLocales.includes(locale)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params
  if (!hasContent(toSeoLocale(rawLocale))) return {}
  return localizedPageMetadata({
    rawLocale,
    key: KEY,
    titleKey: 'romanticDinnerTitle',
    descriptionKey: 'romanticDinnerDescription',
    absoluteTitle: true,
  })
}

export default async function RomanticDinnerPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = toSeoLocale(rawLocale)
  if (!hasContent(locale)) notFound()
  return <SeoLandingPage pageKey={KEY} locale={locale} />
}
