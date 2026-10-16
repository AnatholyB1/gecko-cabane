/**
 * SEO helpers: single source of truth for every public SEO URL
 * (canonical, hreflang, OpenGraph, sitemap, JSON-LD).
 *
 * Pure module: only type-only imports so vitest (node env) can load it.
 */

import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// URLs and locales
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://geckocabanerestaurant.com'

export const LOCALES = ['fr', 'en'] as const
export type SeoLocale = (typeof LOCALES)[number]

export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' } as const

/** Only published pages (D-14). */
export const PUBLISHED_PATHS = ['', '/privacy'] as const

export function localeUrl(locale: SeoLocale, path = ''): string {
  return `${SITE_URL}/${locale}${path}`
}

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

/**
 * Builds the complete Metadata for a localized page.
 * Next metadata merging is shallow: every page must return the full object
 * and layouts must not set `alternates`.
 */
export function buildPageMetadata(args: {
  locale: SeoLocale
  path?: string
  title: string
  description: string
  absoluteTitle?: boolean
}): Metadata {
  const { locale, path = '', title, description, absoluteTitle } = args
  const other: SeoLocale = locale === 'fr' ? 'en' : 'fr'
  const url = localeUrl(locale, path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: localeUrl('fr', path),
        en: localeUrl('en', path),
        'x-default': localeUrl('fr', path),
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Gecko Cabane',
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[other]],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
