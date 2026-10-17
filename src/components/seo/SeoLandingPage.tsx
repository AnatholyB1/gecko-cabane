import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import GcDivider from '@/components/ui/GcDivider'
import { PAGES, googleDirectionsUrl, publishedLocales, type PageKey, type SeoLocale } from '@/utils/seo'
import { LANDING, TRANSPORT_FACTS, type LandingSection } from './pages.config'
import RelatedGuides from './RelatedGuides'
import { BTN_GOLD, BTN_IVORY, H2, PROSE, TEXT_LINK } from './styles'

type Props = { pageKey: PageKey; locale: SeoLocale }

/** Shared landing template (D-03): hero, sections from LANDING config, related guides, closing CTA. */
export default async function SeoLandingPage({ pageKey, locale }: Props) {
  const config = LANDING[pageKey]
  const page = PAGES.find((p) => p.key === pageKey)
  if (!config || !page) throw new Error(`No landing config for ${pageKey}`)
  const ns = page.namespace

  const t = await getTranslations({ locale, namespace: ns })
  const ts = await getTranslations({ locale, namespace: 'seoLanding' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  function renderLink(section: LandingSection) {
    if (section.link === 'reservation') {
      return (
        <Link href="/#reservation" className={`${TEXT_LINK} mt-2`}>
          {t(`sections.${section.id}.link`)}
        </Link>
      )
    }
    if (section.link === 'menu') {
      return (
        <Link href="/menu" className={`${TEXT_LINK} mt-2`}>
          {t(`sections.${section.id}.link`)}
        </Link>
      )
    }
    if (section.link === 'directions') {
      return (
        <a
          href={googleDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`${TEXT_LINK} mt-2 inline-block`}
        >
          {t(`sections.${section.id}.link`)}
        </a>
      )
    }
    return null
  }

  // D-10: only rows with sourced figures are shown; no data means no list at all.
  function renderFacts(section: LandingSection) {
    if (!section.facts) return null
    const rows = TRANSPORT_FACTS.filter((f) => f.minutes || f.thb)
    if (rows.length === 0) return null
    return (
      <>
        <dl className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
          {rows.map((f) => (
            <div key={f.mode}>
              <dt className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-text-mid">
                {t(`facts.modes.${f.mode}`)}
              </dt>
              <dd className="font-cormorant text-[16px] leading-[1.7] text-gc-text-mid">
                {f.minutes && t('facts.duration', { min: f.minutes[0], max: f.minutes[1] })}
                {f.minutes && f.thb && ' · '}
                {f.thb && t('facts.price', { min: f.thb[0], max: f.thb[1] })}
              </dd>
            </div>
          ))}
        </dl>
        <p className="font-cormorant text-[16px] leading-[1.7] text-gc-text-mid mt-2">
          {t('facts.approx')}
        </p>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gc-ivory font-cormorant">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gc-gold focus:text-gc-void focus:px-4 focus:py-2 focus:font-cinzel focus:text-[12px] focus:tracking-[0.1em]"
      >
        {tc('skipToContent')}
      </a>
      <SiteHeader locale={locale} availableLocales={publishedLocales(pageKey)} />
      <main id="main-content">
        <section className="bg-gc-jungle py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-gold">
                {t('eyebrow')}
              </p>
              <h1 className="font-cinzel font-normal text-[32px] leading-[1.2] text-gc-ivory mt-2 hyphens-auto break-words">
                {t('h1')}
              </h1>
              <GcDivider className="my-4" />
              <p className="font-cormorant text-[16px] leading-[1.7] text-gc-ivory/85">
                {t('subtitle')}
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/#reservation" className={BTN_GOLD}>
                  {ts('bookTable')}
                </Link>
                <Link href="/menu" className={BTN_IVORY}>
                  {ts('seeMenu')}
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] md:aspect-video overflow-hidden">
              <Image
                src={config.heroImage}
                alt={t('heroAlt')}
                fill
                priority
                sizes="(min-width: 768px) 512px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {config.sections.map((section, index) => {
          const bg = index % 2 === 0 ? 'bg-gc-ivory' : 'bg-gc-parchment'
          const imageFirst = index % 2 === 1
          const paras = Array.from({ length: section.paras }, (_, i) => `p${i + 1}`)
          const cardKeys = section.cards
            ? Array.from({ length: section.cards }, (_, i) => `c${i + 1}`)
            : []
          const body = (
            <div>
              <h2 className={H2}>{t(`sections.${section.id}.title`)}</h2>
              <GcDivider className="my-4" />
              {paras.map((p, i) => (
                <p key={p} className={i === 0 ? PROSE : `${PROSE} mt-4`}>
                  {t(`sections.${section.id}.${p}`)}
                </p>
              ))}
              {renderFacts(section)}
              {renderLink(section)}
            </div>
          )
          return (
            <section key={section.id} id={section.id} className={`${bg} py-16 px-6`}>
              <div className="max-w-5xl mx-auto">
                {section.image ? (
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div
                      className={`relative aspect-[4/3] overflow-hidden ${imageFirst ? 'md:order-first' : 'md:order-last'}`}
                    >
                      <Image
                        src={section.image}
                        alt={t(`sections.${section.id}.alt`)}
                        fill
                        sizes="(min-width: 768px) 480px, 100vw"
                        className="object-cover object-top"
                      />
                    </div>
                    {body}
                  </div>
                ) : (
                  body
                )}
                {cardKeys.length > 0 && (
                  <ul className="grid md:grid-cols-2 gap-8 mt-8">
                    {cardKeys.map((c) => (
                      <li key={c} className="bg-gc-ivory border border-gc-aged p-6">
                        <h3 className={H2}>{t(`sections.${section.id}.cards.${c}.title`)}</h3>
                        <p className="font-cormorant text-[16px] leading-[1.7] text-gc-text-mid mt-2">
                          {t(`sections.${section.id}.cards.${c}.text`)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )
        })}

        <RelatedGuides pageKey={pageKey} locale={locale} />

        <section className="bg-gc-jungle py-16 px-6 text-center">
          <h2 className="font-cinzel font-semibold text-[20px] leading-[1.2] tracking-wide text-gc-ivory">
            {t('closingTitle')}
          </h2>
          <div className="mt-8">
            <Link href="/#reservation" className={BTN_GOLD}>
              {ts('bookTable')}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
