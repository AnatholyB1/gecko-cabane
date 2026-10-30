// Database types for Gecko Cabane

export interface OpeningHours {
  id: number
  day_of_week: number // 0 = Sunday, 6 = Saturday
  day_name: string
  is_open: boolean
  open_time: string | null // Format: "HH:MM"
  close_time: string | null // Format: "HH:MM"
  created_at: string
  updated_at: string
}

export interface SpecialHours {
  id: number
  date: string // Format: "YYYY-MM-DD"
  title: string | null
  is_open: boolean
  open_time: string | null
  close_time: string | null
  note: string | null
  created_at: string
  updated_at: string
}

// Form types
export interface OpeningHoursFormData {
  day_of_week: number
  day_name: string
  is_open: boolean
  open_time: string
  close_time: string
}

export interface SpecialHoursFormData {
  date: string
  title: string
  is_open: boolean
  open_time: string
  close_time: string
  note: string
}

// Announcement types
export interface Announcement {
  id: number
  title: string | null
  content: string
  is_active: boolean
  bg_color: 'amber' | 'green' | 'red' | 'blue' | 'purple'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementFormData {
  title: string
  content: string
  is_active: boolean
  bg_color: 'amber' | 'green' | 'red' | 'blue' | 'purple'
  start_date: string
  end_date: string
}

// Menu types
export interface MenuPage {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  categories?: MenuCategory[]
}

export interface MenuCategory {
  id: number
  menu_page_id: number
  name: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
  items?: MenuItem[]
}

export interface MenuItem {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number | null
  price_label: string | null
  image_url: string | null
  is_available: boolean
  is_vegetarian: boolean
  is_spicy: boolean
  is_gluten_free?: boolean
  allergens: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuPageFormData {
  name: string
  slug: string
  description: string
  is_active: boolean
}

export interface MenuCategoryFormData {
  menu_page_id: number
  name: string
  description: string
}

export interface MenuItemFormData {
  category_id: number
  name: string
  description: string
  price: number | null
  price_label: string
  image_url: string
  is_available: boolean
  is_vegetarian: boolean
  is_spicy: boolean
  is_gluten_free: boolean
  allergens: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  code?: string
}

// Reservation types
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export type ReservationSource = 'site' | 'whatsapp' | 'telephone' | 'sans_reservation'

export interface Reservation {
  id: number
  customer_name: string
  customer_email: string | null
  customer_phone: string
  reservation_date: string // Format: "YYYY-MM-DD"
  reservation_time: string // Format: "HH:MM"
  party_size: number
  occasion: string | null
  status: ReservationStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  cancelled_at: string | null
  locale: 'fr' | 'en' | 'de' | 'sv'
  // Added by migration 014. review_token is never sent to public responses.
  review_token: string
  review_email_sent_at: string | null
  review_reminder_sent_at: string | null
  review_clicked_at: string | null
  // Added by migration 015 (D-04, D-05).
  source: ReservationSource
  utm_source: string | null
  utm_medium: string | null
  ref: string | null
}

export interface MarketingConsent {
  id: number
  email: string
  consent: boolean
  locale: string
  source: string
  consent_text_version: string
  consented_at: string
  reservation_id: number | null
  created_at: string
}

export interface ReservationFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  occasion: string
  phone_country?: string
  locale: 'fr' | 'en' | 'de' | 'sv'
  marketing_consent: boolean
  company_url?: string
  form_started_at?: number
}

// ---------------------------------------------------------------------------
// Floor plan — physical tables
// ---------------------------------------------------------------------------

export type TableShape = 'square' | 'round' | 'rectangle'

export interface RestaurantTable {
  id: number
  name: string
  seats: number
  /** Center position — 0 to 100 as % of the floor plan container width */
  position_x: number
  /** Center position — 0 to 100 as % of the floor plan container height */
  position_y: number
  /** Width as % of container */
  width: number
  /** Height as % of container */
  height: number
  shape: TableShape
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table configurations
// ---------------------------------------------------------------------------

export interface TableConfiguration {
  id: number
  name: string
  min_capacity: number
  max_capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
  /** Populated via JOIN */
  tables?: RestaurantTable[]
}

export interface TableConfigurationFormData {
  name: string
  min_capacity: number
  max_capacity: number
  table_ids: number[]
}

// ---------------------------------------------------------------------------
// Table assignments (reservation ↔ configuration)
// ---------------------------------------------------------------------------

export interface TableAssignment {
  id: number
  reservation_id: number
  table_configuration_id: number
  /** ISO timestamp — table is blocked until this moment */
  blocked_until: string
  created_at: string
}

export interface TableAssignmentWithDetails extends TableAssignment {
  configuration: TableConfiguration & { tables: RestaurantTable[] }
  reservation: Reservation
}

/** Per-configuration availability result returned by GET /api/tables/assignments */
export interface ConfigAvailability {
  configuration: TableConfiguration & { tables: RestaurantTable[] }
  available: boolean
  /** True if this configuration is already assigned to the target reservation */
  assigned_to_current: boolean
}

// ---------------------------------------------------------------------------
// Restaurant settings
// ---------------------------------------------------------------------------

export interface RestaurantSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}

// Admin membership (checked by gecko_is_admin())
export interface GeckoAdmin {
  id: string // uuid, FK auth.users
  email: string
  created_at: string
}

// ---------------------------------------------------------------------------
// KPI hebdomadaires (phase 8)
// ---------------------------------------------------------------------------

export type KpiReportMode = 'test' | 'live'

export type KpiSourceKey =
  | 'reservations'
  | 'newsletter'
  | 'review_clicks'
  | 'search_console'
  | 'tripadvisor'
  | 'google_reviews'
  | 'manual_reviews'

export type KpiSourceState = 'ok' | 'partial' | 'unavailable'

export type KpiSourcesStatus = Partial<Record<KpiSourceKey, KpiSourceState>>

export interface KpiAlert {
  code: string
  severity: 'warning' | 'critical'
  metric: string
  message: string
  current: number | null
  previous: number | null
}

export interface KpiNarrative {
  lecture: string[]
  actions: string[]
  source: 'ai' | 'fallback'
}

/** One row of gecko_weekly_kpis (migration 018): one property per column. */
export interface WeeklyKpiRow {
  week_start: string // date, Monday (Krabi)
  week_end: string // date, Sunday

  reservations_new: number | null
  covers: number | null
  completed: number | null
  no_show: number | null
  cancelled: number | null
  no_show_rate: number | null
  reservations_by_source: Record<string, number> | null
  review_clicks_week: Record<string, number> | null
  review_clicks_snapshot: Record<string, number> | null
  review_clicks_snapshot_month: string | null
  newsletter_popup_shown: number | null
  newsletter_subscribed: number | null
  newsletter_confirmed: number | null
  newsletter_unsubscribed: number | null
  newsletter_active_total: number | null
  gsc_clicks: number | null
  gsc_impressions: number | null
  gsc_ctr: number | null
  gsc_position: number | null
  gsc_days_covered: number | null
  gsc_partial: boolean | null
  tripadvisor_rank: number | null
  tripadvisor_total: number | null
  tripadvisor_checked_at: string | null
  sources_status: KpiSourcesStatus
  alerts: KpiAlert[]
  narrative: KpiNarrative | null
  report_mode: KpiReportMode | null
  report_sent_at: string | null
  collected_at: string | null

  google_reviews_total: number | null
  google_new_reviews: number | null
  google_min_rating: number | null
  manual_note: string | null
  manual_updated_at: string | null

  created_at: string
  updated_at: string
}

/**
 * Columns written by the weekly cron (service role). google_reviews_total and google_new_reviews
 * are also admin-editable (D-03 manual entry): the collector fills them from Places API only while
 * they are empty, it never overwrites a stored value. google_min_rating and manual_note stay manual.
 */
export const KPI_COLLECTOR_COLUMNS = [
  'reservations_new',
  'covers',
  'completed',
  'no_show',
  'cancelled',
  'no_show_rate',
  'reservations_by_source',
  'review_clicks_week',
  'review_clicks_snapshot',
  'review_clicks_snapshot_month',
  'newsletter_popup_shown',
  'newsletter_subscribed',
  'newsletter_confirmed',
  'newsletter_unsubscribed',
  'newsletter_active_total',
  'gsc_clicks',
  'gsc_impressions',
  'gsc_ctr',
  'gsc_position',
  'gsc_days_covered',
  'gsc_partial',
  'tripadvisor_rank',
  'tripadvisor_total',
  'tripadvisor_checked_at',
  'google_reviews_total',
  'google_new_reviews',
  'sources_status',
  'alerts',
  'narrative',
  'report_mode',
  'report_sent_at',
  'collected_at',
] as const satisfies readonly (keyof WeeklyKpiRow)[]

/** Columns an admin may write (manual entry, D-03). */
export const KPI_MANUAL_COLUMNS = [
  'google_reviews_total',
  'google_new_reviews',
  'google_min_rating',
  'manual_note',
  'manual_updated_at',
] as const satisfies readonly (keyof WeeklyKpiRow)[]
