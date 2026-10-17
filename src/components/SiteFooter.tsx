import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import NewsletterFooterSection from '@/components/NewsletterFooterSection'

type Props = {
  locale: string
}

export default async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'footer' })
  const tp = await getTranslations({ locale, namespace: 'privacy' })

  return (
    <footer className="bg-gc-jungle border-t border-gc-gold/10 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <NewsletterFooterSection locale={locale} idPrefix="site-footer-nl" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gc-gold/10 pt-6">
        <p className="font-cormorant text-[13px] text-gc-ivory/60">
          © 2026 Gecko Cabane Restaurant. {t('rights')}
        </p>
        <Link
          href="/privacy"
          className="font-cormorant text-[13px] text-gc-ivory/60 underline hover:text-gc-gold"
        >
          {tp('title')}
        </Link>
        <p className="font-cormorant text-[12px] text-gc-ivory/50 text-center md:text-right">
          {t('createdBy')}{' '}
          <a href="https://selenium-studio.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-gc-gold underline transition-colors">selenium-studio.com</a>
          {' & '}
          <a href="https://anatholy-bricon.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-gc-gold underline transition-colors">anatholy-bricon.com</a>
        </p>
        </div>
      </div>
    </footer>
  )
}
