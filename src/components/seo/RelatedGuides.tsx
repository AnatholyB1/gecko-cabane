import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import GcDivider from '@/components/ui/GcDivider'
import { PAGES, relatedFor, slugFor, type PageKey, type SeoLocale } from '@/utils/seo'
import { BTN_JUNGLE, H2 } from './styles'

type Props = { pageKey: PageKey; locale: SeoLocale }

/** "A decouvrir" block (D-04): cards to related pages published in the same locale only. */
export default async function RelatedGuides({ pageKey, locale }: Props) {
  const keys = relatedFor(pageKey, locale)
  if (keys.length === 0) return null

  const t = await getTranslations({ locale, namespace: 'seoLanding' })
  const tn = await getTranslations({ locale, namespace: 'nav' })

  return (
    <section className="bg-gc-parchment py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className={H2}>{t('discoverTitle')}</h2>
        <GcDivider className="my-4" />
        <ul className="grid md:grid-cols-3 gap-8 mt-8">
          {keys.map((k) => {
            const ns = PAGES.find((p) => p.key === k)!.namespace
            return (
              <li key={k}>
                <Link
                  href={slugFor(k, locale)}
                  className="group block h-full min-h-11 bg-gc-ivory border border-gc-aged p-6 hover:border-gc-jungle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-jungle"
                >
                  <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-copper">
                    {t('guideEyebrow')}
                  </p>
                  <h3 className="font-cinzel font-semibold text-[20px] leading-[1.2] text-gc-text-dark mt-2">
                    {tn(ns)}
                  </h3>
                  <p className="font-cormorant text-[16px] leading-[1.7] text-gc-text-mid mt-2">
                    {tn(`${ns}Hint`)}
                  </p>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="mt-4 text-gc-jungle motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                  />
                  <span className="sr-only">{t('readGuide')}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/#reservation" className={BTN_JUNGLE}>
            {t('bookTable')}
          </Link>
        </div>
      </div>
    </section>
  )
}
