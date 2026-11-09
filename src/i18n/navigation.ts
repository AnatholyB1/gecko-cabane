import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from './config'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

// Canonical (internal, English-slug) pathname on server AND client: next/navigation usePathname gives the
// rewritten path on the server but the visible translated slug in the browser (React #418 on hydration).
export const { usePathname: useCanonicalPathname } = createNavigation(routing)
