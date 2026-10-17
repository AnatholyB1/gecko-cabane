import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import UtilityCard from '@/components/ui/UtilityCard'
import { primaryLightClass as primaryClass, secondaryLightClass as secondaryClass } from '@/components/ui/buttonClasses'
import { isReviewToken } from '@/utils/review-links'
import { markReviewClicked } from '@/utils/review-tracking'
import { googleReviewUrl, tripAdvisorReviewUrl, LOCALES, type SeoLocale } from '@/utils/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveLocale(raw: string): SeoLocale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'review' })
  // D-11: utility page, never indexed, no self-referencing URL metadata.
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

function ExternalArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

export default async function ReviewPage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const sp = await searchParams
  const rid = typeof sp.rid === 'string' ? sp.rid : null
  // D-13: first click stops the J+5 reminder; output is identical for any rid.
  if (isReviewToken(rid)) await markReviewClicked(rid)
  const locale = resolveLocale(raw)
  const t = await getTranslations({ locale, namespace: 'review' })

  return (
    <main className="min-h-screen bg-gc-void pt-16 pb-24 sm:pb-16 px-4">
      <UtilityCard title={t('title')}>
        <div>
          <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark max-w-[34ch] mx-auto mt-4">
            {t('intro')}
          </p>

          <div className="flex flex-col gap-4 mt-6">
            <a href={googleReviewUrl()} target="_blank" rel="noopener noreferrer" className={primaryClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.5-5.8" />
                <path d="M12 12h8" />
              </svg>
              <span>{t('google')}</span>
              <ExternalArrow />
              <span className="sr-only">{t('newTab')}</span>
            </a>
            <a href={tripAdvisorReviewUrl()} target="_blank" rel="noopener noreferrer" className={secondaryClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="7.5" cy="13" r="3.5" />
                <circle cx="16.5" cy="13" r="3.5" />
                <path d="M3 9.5c3-2.5 15-2.5 18 0" strokeLinecap="round" />
              </svg>
              <span>{t('tripadvisor')}</span>
              <ExternalArrow />
              <span className="sr-only">{t('newTab')}</span>
            </a>
          </div>

          <p className="font-cormorant italic text-[14px] leading-[1.5] text-gc-text-mid mt-6">{t('note')}</p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center mt-4 font-cormorant text-[14px] text-gc-jungle underline decoration-gc-jungle hover:text-gc-void"
          >
            {t('back')}
          </Link>
        </div>
      </UtilityCard>
    </main>
  )
}
