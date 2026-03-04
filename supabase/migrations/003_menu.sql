-- Create table for menu pages (e.g., "Carte du midi", "Carte du soir", "Boissons")
CREATE TABLE IF NOT EXISTS menu_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for menu categories (e.g., "Entrées", "Plats", "Desserts")
CREATE TABLE IF NOT EXISTS menu_categories (
  id SERIAL PRIMARY KEY,
  menu_page_id INTEGER NOT NULL REFERENCES menu_pages(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for menu items (dishes)
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  price_label VARCHAR(50), -- For custom price labels like "Market price" or "15€ / 25€"
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  allergens TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_page ON menu_categories(menu_page_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_pages_order ON menu_pages(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(display_order);

-- Enable Row Level Security
ALTER TABLE menu_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on menu_pages" ON menu_pages
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on menu_categories" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on menu_items" ON menu_items
  FOR SELECT USING (true);

-- Allow authenticated users to manage
CREATE POLICY "Allow authenticated users to manage menu_pages" ON menu_pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage menu_categories" ON menu_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage menu_items" ON menu_items
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Storage bucket for menu images
-- Run this SQL in Supabase Dashboard > SQL Editor
-- ============================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view images
CREATE POLICY "Public can view menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
