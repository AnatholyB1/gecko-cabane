import * as Sentry from '@sentry/nextjs'
import { getTranslations } from 'next-intl/server'
import { getOpeningHours, getSpecialHours } from '@/utils/opening-hours'
import { krabiTodayYmd } from '@/utils/krabi-time'
import {
  buildRestaurantJsonLd,
  serializeJsonLd,
  type OpeningHoursRow,
  type SeoLocale,
  type SpecialHoursRow,
} from '@/utils/seo'

/**
 * Restaurant JSON-LD (Server Component, D-04). Weekly hours and the next 60 days of exceptions
 * come from the cached DB reads (tag opening-hours); if one fails the schema is rendered without
 * it (never hard-coded) and the error goes to Sentry.
 */
export default async function RestaurantJsonLd({ locale }: { locale: SeoLocale }) {
  const t = await getTranslations({ locale, namespace: 'meta' })
  let hoursRows: OpeningHoursRow[] = []
  try {
    hoursRows = await getOpeningHours()
  } catch (error) {
    Sentry.captureException(error)
  }
  let specialRows: SpecialHoursRow[] = []
  try {
    specialRows = await getSpecialHours()
  } catch (error) {
    Sentry.captureException(error)
  }
  const data = buildRestaurantJsonLd({
    locale,
    description: t('schemaDescription'),
    hoursRows,
    specialRows,
    today: krabiTodayYmd(),
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
