-- Create Dashboard Tables in Supabase
-- Run this in Supabase SQL Editor

-- Table: dashboards (for storing custom dashboards)
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_id VARCHAR(255) NOT NULL,
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  theme_color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: dashboard_fields (for storing form field definitions)
CREATE TABLE IF NOT EXISTS dashboard_fields (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  required BOOLEAN DEFAULT false,
  default_value TEXT,
  description TEXT,
  options JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_workflow_id ON dashboards(workflow_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_instance_id ON dashboards(instance_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_fields_dashboard_id ON dashboard_fields(dashboard_id);

-- Enable Row Level Security (for future multi-tenancy)
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_fields ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow all access (no authentication)
CREATE POLICY "Allow all for MVP dashboards" ON dashboards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for MVP dashboard_fields" ON dashboard_fields FOR ALL USING (true) WITH CHECK (true);

-- Verify tables created
SELECT 'Dashboard tables created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dashboards', 'dashboard_fields', 'instances', 'execution_logs')
ORDER BY table_name;
