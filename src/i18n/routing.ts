import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'
import { buildPathnames } from '@/utils/seo'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
  // No Link hreflang header: HTML hreflang (x-default -> /fr) is the only signal
  alternateLinks: false,
  // Translated slugs come from the single registry (D-01); EN keeps the key as-is.
  pathnames: buildPathnames(),
})
