import * as Sentry from '@sentry/nextjs'
import { getTranslations } from 'next-intl/server'
import { getOpeningHours } from '@/utils/opening-hours'
import {
  buildRestaurantJsonLd,
  serializeJsonLd,
  type OpeningHoursRow,
  type SeoLocale,
} from '@/utils/seo'

/**
 * Restaurant JSON-LD (Server Component, D-04). Hours come from the cached DB read;
 * if it fails the schema is rendered without hours (never hard-coded) and the error goes to Sentry.
 */
export default async function RestaurantJsonLd({ locale }: { locale: SeoLocale }) {
  const t = await getTranslations({ locale, namespace: 'meta' })
  let hoursRows: OpeningHoursRow[] = []
  try {
    hoursRows = await getOpeningHours()
  } catch (error) {
    Sentry.captureException(error)
  }
  const data = buildRestaurantJsonLd({
    locale,
    description: t('schemaDescription'),
    hoursRows,
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
