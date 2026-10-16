-- Physical tables in the restaurant (floor plan)
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  seats INTEGER NOT NULL DEFAULT 2 CHECK (seats > 0 AND seats <= 30),
  -- Position as percentage (0-100) of the floor plan container dimensions
  position_x DOUBLE PRECISION NOT NULL DEFAULT 50 CHECK (position_x >= 0 AND position_x <= 100),
  position_y DOUBLE PRECISION NOT NULL DEFAULT 50 CHECK (position_y >= 0 AND position_y <= 100),
  -- Size as percentage of the floor plan container
  width  DOUBLE PRECISION NOT NULL DEFAULT 9,
  height DOUBLE PRECISION NOT NULL DEFAULT 11,
  shape VARCHAR(20) NOT NULL DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Named configurations: one or more tables grouped for a given seating arrangement
-- Examples: "T1 seul (2p)", "T1+T2 joints (4p)", "Grande table ronde (6-8p)"
CREATE TABLE IF NOT EXISTS table_configurations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 1 CHECK (min_capacity > 0),
  max_capacity INTEGER NOT NULL DEFAULT 2 CHECK (max_capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_capacity CHECK (max_capacity >= min_capacity)
);

-- Junction table: which physical tables compose a configuration
CREATE TABLE IF NOT EXISTS table_configuration_tables (
  table_configuration_id INTEGER NOT NULL REFERENCES table_configurations(id) ON DELETE CASCADE,
  table_id               INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  PRIMARY KEY (table_configuration_id, table_id)
);

-- Assignment: a reservation placed on a table configuration
-- blocked_until = reservation datetime + table_block_duration_minutes (from settings)
CREATE TABLE IF NOT EXISTS table_assignments (
  id                       SERIAL PRIMARY KEY,
  reservation_id           INTEGER NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  table_configuration_id   INTEGER NOT NULL REFERENCES table_configurations(id),
  blocked_until            TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Key-value store for admin-configurable parameters
CREATE TABLE IF NOT EXISTS restaurant_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings
INSERT INTO restaurant_settings (key, value, description) VALUES
  ('table_block_duration_minutes', '120',
   'Durée de blocage d''une table après le début d''une réservation (minutes)'),
  ('max_covers', '40',
   'Nombre maximum de couverts par service')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_assignments_blocked ON table_assignments(blocked_until);
CREATE INDEX IF NOT EXISTS idx_table_assignments_config  ON table_assignments(table_configuration_id);
CREATE INDEX IF NOT EXISTS idx_table_config_tables_table ON table_configuration_tables(table_id);
CREATE INDEX IF NOT EXISTS idx_tables_active             ON tables(is_active);

-- Row Level Security
ALTER TABLE tables                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_configurations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_configuration_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_assignments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tables"          ON tables FOR SELECT USING (true);
CREATE POLICY "Auth manage tables"          ON tables FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read table_configurations"  ON table_configurations FOR SELECT USING (true);
CREATE POLICY "Auth manage table_configurations"  ON table_configurations FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read table_configuration_tables"  ON table_configuration_tables FOR SELECT USING (true);
CREATE POLICY "Auth manage table_configuration_tables"  ON table_configuration_tables FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read table_assignments"  ON table_assignments FOR SELECT USING (true);
CREATE POLICY "Auth manage table_assignments"  ON table_assignments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read restaurant_settings"  ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Auth manage restaurant_settings"  ON restaurant_settings FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update updated_at (function may already exist from previous migration)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER table_configurations_updated_at
  BEFORE UPDATE ON table_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
