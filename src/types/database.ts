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
