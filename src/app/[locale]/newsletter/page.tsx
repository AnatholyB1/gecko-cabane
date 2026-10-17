import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NewsletterForm from '@/components/NewsletterForm'
import UtilityCard from '@/components/ui/UtilityCard'
import { LOCALES, type SeoLocale } from '@/utils/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveLocale(raw: string): SeoLocale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.page' })
  // D-12: utility page, never indexed, no self-referencing URL metadata.
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function NewsletterPage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.page' })
  // Bill QR (?src=qr) is recorded apart from the review link and the footer form (D-12).
  const source = sp.src === 'qr' ? 'bill_qr' : 'newsletter_page'

  return (
    <main className="min-h-screen bg-gc-void pt-16 pb-24 sm:pb-16 px-4">
      <UtilityCard title={t('title')} titleSize="display">
        <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark max-w-[34ch] mx-auto mt-4">
          {t('body')}
        </p>
        <p className="font-cormorant italic text-[14px] leading-[1.5] text-gc-text-mid mt-4">{t('teaser')}</p>
        <div className="mt-6 text-left">
          <NewsletterForm
            source={source}
            variant="light"
            showResident
            submitLabel="recipe"
            idPrefix="nl-page"
          />
        </div>
      </UtilityCard>
    </main>
  )
}
