import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { summarizeUniformHours, type UniformHours } from '@/utils/hours-text'
import { addDaysToYmd, SPECIAL_HOURS_HORIZON_DAYS, type OpeningHoursRow, type SeoLocale, type SpecialHoursRow } from '@/utils/seo'
import { krabiTodayYmd } from '@/utils/krabi-time'

export const OPENING_HOURS_TAG = 'opening-hours'

/**
 * Opening hours for the JSON-LD schema, cached 1 h under the 'opening-hours' tag.
 * Uses the anon key + public-read RLS (migration 007): never the cookie-bound server client
 * inside a cache scope (it reads cookies()) and never the service role for a public read.
 * Throws on error so failures are not cached.
 */
export const getOpeningHours = unstable_cache(
  async (): Promise<OpeningHoursRow[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data, error } = await supabase
      .from('gecko_opening_hours')
      .select('day_of_week, is_open, open_time, close_time')
      .order('day_of_week', { ascending: true })
    if (error) throw error
    return (data ?? []) as OpeningHoursRow[]
  },
  ['gecko-opening-hours'],
  { tags: [OPENING_HOURS_TAG], revalidate: 3600 },
)

/**
 * Dated exceptions of the next SPECIAL_HOURS_HORIZON_DAYS days (gecko_special_hours, which also holds
 * the "Complet ce soir" closures), same cache tag as the weekly hours: routes that write either
 * table revalidate OPENING_HOURS_TAG. Anon key + public-read RLS (migration 007); throws on error.
 */
export const getSpecialHours = unstable_cache(
  async (): Promise<SpecialHoursRow[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const today = krabiTodayYmd()
    const { data, error } = await supabase
      .from('gecko_special_hours')
      .select('date, is_open, open_time, close_time')
      .gte('date', today)
      .lte('date', addDaysToYmd(today, SPECIAL_HOURS_HORIZON_DAYS))
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as SpecialHoursRow[]
  },
  ['gecko-special-hours'],
  { tags: [OPENING_HOURS_TAG], revalidate: 3600 },
)

/**
 * Hours for visible text (footer, kitchen close, guides), localized. null when the hours are not
 * identical on the 7 days or cannot be read (error reported to Sentry): the page then shows a text
 * without any hour instead of a stale or invented one.
 */
export async function getHoursSummary(locale: SeoLocale): Promise<UniformHours | null> {
  try {
    return summarizeUniformHours(await getOpeningHours(), locale)
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}
