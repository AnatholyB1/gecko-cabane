import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { OpeningHoursRow } from '@/utils/seo'

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
