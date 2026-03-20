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
  allergens: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Reservation types
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

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
}

export interface ReservationFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  occasion: string
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

export interface PhoneVerification {
  id: number
  phone: string
  verified_token: string
  token_expires_at: string
  created_at: string
}

