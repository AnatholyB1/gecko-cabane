import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buildPageMetadata, mapOpeningHours, SAME_AS } from '@/utils/seo'
import { getOpeningHours } from '@/utils/opening-hours'
import { getMenu } from '@/utils/menu'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import RestaurantJsonLd from '@/components/RestaurantJsonLd'
import GcDivider from '@/components/ui/GcDivider'

const GOOGLE_PLACE_URL = SAME_AS.find((u) => u.includes('google.com/maps'))

const DISHES = [
  { key: 'bourguignon', src: '/food-bourguignon.jpg' },
  { key: 'veloute', src: '/food-veloute.jpg' },
  { key: 'pouletCreme', src: '/food-poulet-creme.jpg' },
  { key: 'massaman', src: '/food-massaman.jpg' },
] as const

type Props = {
  params: Promise<{ locale: string }>
}

// EN-only page (D-14): FR landing arrives with PAGE-08 in phase 6.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (locale !== 'en') return {}
  const t = await getTranslations({ locale: 'en', namespace: 'meta' })
  return buildPageMetadata({
    locale: 'en',
    path: '/french-restaurant-krabi',
    locales: ['en'],
    title: t('frenchRestaurantTitle'),
    description: t('frenchRestaurantDescription'),
    absoluteTitle: true,
  })
}

const BTN_GOLD =
  'inline-flex items-center justify-center min-h-11 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-8 py-4 hover:bg-gc-gold hover:text-gc-void transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold'
const BTN_IVORY =
  'inline-flex items-center justify-center min-h-11 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-ivory border border-gc-ivory/60 px-8 py-4 hover:bg-gc-ivory hover:text-gc-jungle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold'
const H2 = 'font-cinzel font-semibold text-[20px] leading-[1.2] tracking-wide text-gc-text-dark'
const PROSE = 'font-cormorant text-[16px] leading-[1.7] text-gc-text-mid max-w-[65ch]'
const TEXT_LINK =
  'inline-flex items-center min-h-11 font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-jungle underline hover:text-gc-text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-jungle'

export default async function FrenchRestaurantPage({ params }: Props) {
  const { locale } = await params
  if (locale !== 'en') notFound()

  const t = await getTranslations({ locale: 'en', namespace: 'frenchRestaurant' })
  const tc = await getTranslations({ locale: 'en', namespace: 'common' })
  // Not caught on purpose: errors fall to error.tsx so an error page is never cached as content.
  const [hoursRows, menu] = await Promise.all([getOpeningHours(), getMenu()])
  const belgianHref = menu.some((p) => p.slug === 'vins-bieres-belges')
    ? '/menu#vins-bieres-belges'
    : '/menu'
  const hours = mapOpeningHours(hoursRows)

  return (
    <div className="min-h-screen bg-gc-ivory font-cormorant">
      <RestaurantJsonLd locale="en" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gc-gold focus:text-gc-void focus:px-4 focus:py-2 focus:font-cinzel focus:text-[12px] focus:tracking-[0.1em]"
      >
        {tc('skipToContent')}
      </a>
      <SiteHeader locale="en" availableLocales={['en']} />
      <main id="main-content">
        {/* 1. Hero */}
        <section className="bg-gc-jungle py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-gold">
                {t('eyebrow')}
              </p>
              <h1 className="font-cinzel font-normal text-[32px] leading-[1.2] text-gc-ivory mt-2">
                {t('h1')}
              </h1>
              <GcDivider className="my-4" />
              <p className="font-cormorant text-[16px] leading-[1.7] text-gc-ivory/85">
                {t('subtitle')}
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/#reservation" className={BTN_GOLD}>
                  {t('ctaBook')}
                </Link>
                <Link href="/menu" className={BTN_IVORY}>
                  {t('ctaMenu')}
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] md:aspect-video overflow-hidden">
              <Image
                src="/exterior-entrance.jpg"
                alt={t('heroAlt')}
                fill
                priority
                sizes="(min-width: 768px) 512px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* 2. Intro */}
        <section className="bg-gc-ivory py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className={H2}>{t('introTitle')}</h2>
            <GcDivider className="my-4" />
            <p className={PROSE}>{t('intro1')}</p>
            <p className={`${PROSE} mt-4`}>{t('intro2')}</p>
          </div>
        </section>

        {/* 3. Signature dishes */}
        <section className="bg-gc-parchment py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className={H2}>{t('dishesTitle')}</h2>
            <GcDivider className="my-4" />
            <ul className="grid md:grid-cols-2 gap-8 mt-8">
              {DISHES.map(({ key, src }) => (
                <li key={key} className="bg-gc-ivory border border-gc-aged">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={src}
                      alt={t(`${key}.alt`)}
                      fill
                      sizes="(min-width: 768px) 480px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className={H2}>{t(`${key}.name`)}</h3>
                    <p className="font-cormorant text-[16px] leading-[1.7] text-gc-text-mid mt-2">
                      {t(`${key}.text`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Wines and Belgian beers */}
        <section className="bg-gc-ivory py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className={H2}>{t('winesTitle')}</h2>
            <GcDivider className="my-4" />
            <p className={PROSE}>{t('winesText')}</p>
            <Link href={belgianHref} className={`${TEXT_LINK} mt-2`}>
              {t('winesLink')}
            </Link>
          </div>
        </section>

        {/* 5. Story */}
        <section className="bg-gc-parchment py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden">
              <Image
                src="/chef-jariya.jpg"
                alt={t('chefAlt')}
                fill
                sizes="(min-width: 768px) 512px, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div>
              <h2 className={H2}>{t('storyTitle')}</h2>
              <GcDivider className="my-4" />
              <p className={PROSE}>{t('story1')}</p>
              <p className={`${PROSE} mt-4`}>{t('story2')}</p>
            </div>
          </div>
        </section>

        {/* 6. Find us */}
        <section className="bg-gc-ivory py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className={H2}>{t('findTitle')}</h2>
            <GcDivider className="my-4" />
            <address className={`${PROSE} not-italic`}>{t('address')}</address>
            <h3 className={`${H2} mt-6`}>{t('hoursTitle')}</h3>
            <ul className={`${PROSE} mt-2`}>
              {hours.map((spec) => (
                <li key={`${spec.opens}-${spec.closes}`}>
                  {t('hoursLine', {
                    days: spec.dayOfWeek.join(', '),
                    opens: spec.opens,
                    closes: spec.closes,
                  })}
                </li>
              ))}
            </ul>
            <p className={`${PROSE} mt-1`}>{t('closedNote')}</p>
            <div className="flex flex-wrap gap-x-8 mt-4">
              {GOOGLE_PLACE_URL && (
                <a
                  href={GOOGLE_PLACE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={TEXT_LINK}
                >
                  {t('directionsLink')}
                </a>
              )}
              <a href="tel:+66819585945" className={TEXT_LINK}>
                {t('phoneLabel')}
              </a>
            </div>
          </div>
        </section>

        {/* 7. Closing CTA */}
        <section className="bg-gc-jungle py-16 px-6 text-center">
          <h2 className="font-cinzel font-semibold text-[20px] leading-[1.2] tracking-wide text-gc-ivory">
            {t('closingTitle')}
          </h2>
          <div className="mt-8">
            <Link href="/#reservation" className={BTN_GOLD}>
              {t('ctaBook')}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale="en" />
    </div>
  )
}
