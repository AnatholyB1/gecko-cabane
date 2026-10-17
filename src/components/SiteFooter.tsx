import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import NextLink from 'next/link'
import { guidesFor, toSeoLocale, TRIPADVISOR_URL } from '@/utils/seo'

type Props = {
  locale: string
}

const ROW =
  'inline-flex items-center min-h-11 font-cormorant text-[14px] text-gc-ivory/60 hover:text-gc-gold transition-colors'
const TITLE = 'font-cinzel text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-2'

export default async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'footer' })
  const tp = await getTranslations({ locale, namespace: 'privacy' })
  const tn = await getTranslations({ locale, namespace: 'nav' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  const guides = guidesFor(toSeoLocale(locale))

  return (
    <footer className="bg-gc-jungle border-t border-gc-gold/10 py-8 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-8">
        <div className="flex flex-col">
          <h2 className={TITLE}>{t('navigateTitle')}</h2>
          <Link href="/menu" className={ROW}>{tc('menu')}</Link>
          <Link href="/#reservation" className={ROW}>{tc('bookTable')}</Link>
          <Link href="/privacy" className={ROW}>{tp('title')}</Link>
        </div>
        {guides.length > 0 && (
          <nav aria-label={t('guidesTitle')} className="flex flex-col">
            <h2 className={TITLE}>{t('guidesTitle')}</h2>
            {guides.map((g) => (
              <NextLink key={g.href} href={g.href} className={ROW}>
                {tn(g.namespace as never)}
              </NextLink>
            ))}
          </nav>
        )}
        <div className="flex flex-col">
          <h2 className={TITLE}>{t('contactTitle')}</h2>
          <a href="tel:+66819585945" className={ROW}>+66 81 958 5945</a>
          <a href={TRIPADVISOR_URL} target="_blank" rel="noopener noreferrer" className={ROW}>
            TripAdvisor
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gc-gold/10 pt-5">
        <p className="font-cormorant text-[13px] text-gc-ivory/60">
          © 2026 Gecko Cabane Restaurant. {t('rights')}
        </p>
        <p className="font-cormorant text-[12px] text-gc-ivory/50 text-center md:text-right">
          {t('createdBy')}{' '}
          <a href="https://selenium-studio.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-gc-gold underline transition-colors">selenium-studio.com</a>
          {' & '}
          <a href="https://anatholy-bricon.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-gc-gold underline transition-colors">anatholy-bricon.com</a>
        </p>
      </div>
    </footer>
  )
}
