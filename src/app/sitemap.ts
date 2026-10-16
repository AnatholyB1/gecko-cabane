import type { MetadataRoute } from 'next'
import { localeUrl, LOCALES, PUBLISHED_PATHS } from '@/utils/seo'

// Only published pages are listed: future pages are added in their own phase,
// never a forecast URL. No lastModified: we do not fabricate dates.
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PUBLISHED_PATHS.map((path) => ({
      url: localeUrl(locale, path),
      alternates: {
        languages: {
          fr: localeUrl('fr', path),
          en: localeUrl('en', path),
          'x-default': localeUrl('fr', path),
        },
      },
    }))
  )
}
