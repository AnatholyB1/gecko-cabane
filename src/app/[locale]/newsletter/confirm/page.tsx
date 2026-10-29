import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import UtilityCard from '@/components/ui/UtilityCard'
import NewsletterConfirmButton from '@/components/NewsletterConfirmButton'
import { primaryLightClass } from '@/components/ui/buttonClasses'
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
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.confirm' })
  // Utility page, never indexed, no self-referencing URL metadata.
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)

// GET only renders the button. The state change happens on POST, so link prefetchers
// (mail scanners) never confirm a subscription.
export default async function NewsletterConfirmPage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.confirm' })
  const r = one(sp.r)
  const e = one(sp.e) ?? ''
  const s = one(sp.s)

  return (
    <main className="min-h-screen bg-gc-void pt-16 pb-24 sm:pb-16 px-4">
      <UtilityCard title={t('title')}>
        {r && s ? (
          <NewsletterConfirmButton r={r} e={e} s={s} />
        ) : (
          <div className="mt-6" role="alert">
            <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">{t('invalid')}</p>
            <div className="mt-6">
              <Link href="/" className={primaryLightClass}>
                {t('invalidCta')}
              </Link>
            </div>
          </div>
        )}
      </UtilityCard>
    </main>
  )
}
