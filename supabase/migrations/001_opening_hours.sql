-- Create table for restaurant opening hours
CREATE TABLE IF NOT EXISTS opening_hours (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  day_name VARCHAR(20) NOT NULL,
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for special hours (holidays, events, etc.)
CREATE TABLE IF NOT EXISTS special_hours (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title VARCHAR(100),
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default opening hours (French restaurant style)
INSERT INTO opening_hours (day_of_week, day_name, is_open, open_time, close_time) VALUES
  (0, 'Dimanche', true, '11:00', '23:00'),
  (1, 'Lundi', true, '11:00', '23:00'),
  (2, 'Mardi', false, NULL, NULL),
  (3, 'Mercredi', true, '11:00', '23:00'),
  (4, 'Jeudi', true, '11:00', '23:00'),
  (5, 'Vendredi', true, '11:00', '23:00'),
  (6, 'Samedi', true, '11:00', '23:00')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on opening_hours" ON opening_hours
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on special_hours" ON special_hours
  FOR SELECT USING (true);

-- Allow authenticated users to update/insert/delete
CREATE POLICY "Allow authenticated users to manage opening_hours" ON opening_hours
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage special_hours" ON special_hours
  FOR ALL USING (auth.role() = 'authenticated');
