import { getTranslations } from 'next-intl/server'
import { guidesFor, toSeoLocale } from '@/utils/seo'

/** Published guides for a locale with translated label and hint (server only). */
export async function getGuideItems(locale: string) {
  const t = await getTranslations({ locale, namespace: 'nav' })
  return guidesFor(toSeoLocale(locale)).map((g) => ({
    label: t(g.namespace as never),
    hint: t(`${g.namespace}Hint` as never),
    href: g.href,
  }))
}
