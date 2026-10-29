import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import GuidesMenu from '@/components/GuidesMenu'
import { getGuideItems } from '@/components/guideItems'

type Props = {
  locale: string
}

export default async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'common' })
  const tg = await getTranslations({ locale, namespace: 'guides' })
  const items = await getGuideItems(locale)

  return (
    <header className="bg-gc-jungle border-b border-gc-gold/10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center gap-4">
        <Link
          href="/"
          className="font-cinzel-decorative font-bold text-gc-gold text-lg sm:text-xl tracking-[0.1em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold"
          aria-label={t('homeAriaLabel')}
        >
          GECKO CABANE
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/menu"
            className="inline-flex items-center min-h-11 max-[399px]:hidden font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-ivory/65 hover:text-gc-gold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold"
          >
            {t('menu')}
          </Link>
          <GuidesMenu items={items} toggleLabel={tg('toggle')} navLabel={tg('ariaLabel')} />
          <LanguageSwitcher />
          <Link
            href="/#reservation"
            className="inline-flex items-center min-h-11 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-4 sm:px-5 hover:bg-gc-gold hover:text-gc-void transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold"
          >
            <span className="hidden min-[480px]:inline">{t('bookTable')}</span>
            <span className="min-[480px]:hidden">{t('reserveShort')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
