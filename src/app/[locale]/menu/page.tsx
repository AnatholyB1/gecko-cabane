import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { localizedPageMetadata } from '@/utils/page-metadata'
import { getMenu } from '@/utils/menu'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import MenuAnchorNav from '@/components/MenuAnchorNav'
import MenuSections from '@/components/MenuSections'
import GcDivider from '@/components/ui/GcDivider'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params
  return localizedPageMetadata({
    rawLocale,
    key: '/menu',
    titleKey: 'menuTitle',
    descriptionKey: 'menuDescription',
    absoluteTitle: true,
  })
}

export default async function MenuPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'menuPage' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  // Not caught on purpose: errors fall to error.tsx so an error page is never cached as content.
  const menu = await getMenu()

  return (
    <div className="min-h-screen bg-gc-ivory font-cormorant">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gc-gold focus:text-gc-void focus:px-4 focus:py-2 focus:font-cinzel focus:text-[12px] focus:tracking-[0.1em]"
      >
        {tc('skipToContent')}
      </a>
      <SiteHeader locale={locale} />
      <main id="main-content" className="bg-gc-ivory">
        <div id="top" />
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
          <header className="mb-12">
            <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-copper">
              {t('eyebrow')}
            </p>
            <h1 className="font-cinzel font-normal text-[32px] leading-[1.2] text-gc-text-dark mt-2">
              {t('title')}
            </h1>
            <GcDivider className="my-4" />
            <p className="font-cormorant italic text-[16px] leading-normal text-gc-text-mid">
              {t('intro')}
            </p>
          </header>

          {menu.length > 0 && <MenuAnchorNav pages={menu} label={t('anchorNavLabel')} />}

          {menu.length === 0 ? (
            <div className="bg-gc-parchment border border-gc-aged p-8 text-center">
              <h2 className="font-cinzel font-semibold text-[20px] leading-[1.2] text-gc-text-dark">
                {t('emptyTitle')}
              </h2>
              <p className="font-cormorant text-[16px] leading-normal text-gc-text-mid mt-2">
                {t('emptyBody')}
              </p>
              <Link
                href="/#reservation"
                className="inline-flex items-center min-h-11 mt-6 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-jungle border border-gc-jungle px-8 hover:bg-gc-jungle hover:text-gc-ivory transition-colors"
              >
                {tc('bookTable')}
              </Link>
            </div>
          ) : (
            <MenuSections locale={locale} menu={menu} />
          )}

          <a
            href="#top"
            className="inline-flex items-center min-h-11 font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-jungle underline hover:text-gc-text-dark"
          >
            {t('backToTop')}
          </a>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
