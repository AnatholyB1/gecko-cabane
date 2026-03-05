'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/config'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('language')
  
  // Remove current locale prefix to get the path
  const pathWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'

  return (
    <div className="flex items-center gap-1 text-sm">
      {locales.map((loc, index) => (
        <span key={loc} className="flex items-center">
          {index > 0 && <span className="text-[var(--warm-gray)] mx-1">|</span>}
          <Link
            href={pathWithoutLocale}
            locale={loc}
            className={`px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 ${
              locale === loc
                ? 'font-bold text-[var(--primary)]'
                : 'text-[var(--warm-gray)] hover:text-[var(--primary)]'
            }`}
            aria-label={t('switchTo', { language: t(loc) })}
            aria-current={locale === loc ? 'true' : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  )
}
