-- Create table for restaurant announcement
CREATE TABLE IF NOT EXISTS announcement (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  bg_color VARCHAR(50) DEFAULT 'amber', -- amber, green, red, blue, purple
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default empty announcement (only one row should exist)
INSERT INTO announcement (id, title, content, is_active) 
VALUES (1, '', '', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE announcement ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on announcement" ON announcement
  FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to manage announcement" ON announcement
  FOR ALL USING (auth.role() = 'authenticated');
