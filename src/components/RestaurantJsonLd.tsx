import * as Sentry from '@sentry/nextjs'
import { getTranslations } from 'next-intl/server'
import { getOpeningHours, getSpecialHours } from '@/utils/opening-hours'
import { krabiTodayYmd } from '@/utils/krabi-time'
import { aggregateRatingFor } from '@/utils/social-proof'
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
 * `includeRating` (default false): the aggregateRating is emitted only by the home page, where the
 * real reviews and the rating are visible (owner decision 2026-11-10).
 */
export default async function RestaurantJsonLd({
  locale,
  includeRating = false,
}: {
  locale: SeoLocale
  includeRating?: boolean
}) {
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
    aggregateRating: includeRating ? aggregateRatingFor() : null,
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
