'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { switcherTargets } from '@/utils/seo'

const BASE =
  'inline-flex items-center min-h-11 px-1 sm:px-1.5 font-raleway text-[11px] sm:text-[12px] tracking-[0.08em] sm:tracking-[0.15em] uppercase border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold'

/**
 * Slug-aware switcher (D-05): only offers locales in which the current page is
 * published, each link going to that locale's own slug. Hidden below 2 targets.
 */
export default function LanguageSwitcher() {
  const pathname = usePathname()
  const t = useTranslations('language')
  const targets = switcherTargets(pathname)

  if (targets.length < 2) return null

  return (
    <nav aria-label={t('changeLanguage')} className="flex items-center gap-0 sm:gap-1">
      {targets.map((target) => {
        const label = t('switchTo', { language: t(target.locale) })
        return target.current ? (
          <span
            key={target.locale}
            lang={target.locale}
            aria-current="true"
            aria-label={label}
            className={`${BASE} border-gc-gold text-gc-gold`}
          >
            {target.locale.toUpperCase()}
          </span>
        ) : (
          <Link
            key={target.locale}
            href={target.href}
            hrefLang={target.locale}
            lang={target.locale}
            aria-label={label}
            className={`${BASE} border-transparent text-gc-ivory/45 hover:text-gc-gold transition-colors`}
          >
            {target.locale.toUpperCase()}
          </Link>
        )
      })}
    </nav>
  )
}
