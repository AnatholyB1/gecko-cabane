import type { MetadataRoute } from 'next'
import { localeUrl, pageLanguages, PUBLISHED_PAGES } from '@/utils/seo'

// Only published pages are listed: future pages are added in their own phase,
// never a forecast URL. No lastModified: we do not fabricate dates.
// Each page is listed only in the locales where it exists (D-14).
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLISHED_PAGES.flatMap((page) =>
    page.locales.map((locale) => ({
      url: localeUrl(locale, page.path),
      alternates: { languages: pageLanguages(page.path, page.locales) },
    }))
  )
}
