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
    <div className="flex items-center gap-0" style={{ fontFamily: 'var(--font-raleway)', fontWeight: 300 }}>
      {locales.map((loc, index) => (
        <span key={loc} className="flex items-center">
          {index > 0 && (
            <span style={{ color: 'var(--gc-gold)', opacity: 0.4, margin: '0 6px', fontSize: '10px' }}>|</span>
          )}
          <Link
            href={pathWithoutLocale}
            locale={loc}
            className="transition-all focus:outline-none"
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: locale === loc ? 'var(--gc-gold)' : 'rgba(250,240,230,0.45)',
              fontWeight: locale === loc ? 400 : 300,
            }}
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
