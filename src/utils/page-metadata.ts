import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, publishedLocales, resolvePageSeo, toSeoLocale, type PageKey } from '@/utils/seo'

/**
 * Metadata for a localized page with the noindex gate (D-05): a (page, locale)
 * pair that is not published gets robots noindex and no canonical/hreflang.
 */
export async function localizedPageMetadata(args: {
  rawLocale: string
  key: PageKey
  titleKey: string
  descriptionKey: string
  absoluteTitle?: boolean
  namespace?: string
}): Promise<Metadata> {
  const { rawLocale, key, titleKey, descriptionKey, absoluteTitle, namespace = 'meta' } = args
  const locale = toSeoLocale(rawLocale)
  const t = await getTranslations({ locale, namespace })
  const title = t(titleKey)
  const description = t(descriptionKey)

  if (!resolvePageSeo(key, locale).index) {
    return {
      title: absoluteTitle ? { absolute: title } : title,
      description,
      robots: { index: false, follow: true },
    }
  }

  return buildPageMetadata({
    locale,
    path: key,
    locales: publishedLocales(key),
    title,
    description,
    absoluteTitle,
  })
}
