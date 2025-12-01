-- n8n-interface Database Schema
-- Run this in Supabase SQL Editor

-- Table: instances
-- Stores n8n instance connection details
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  api_key_encrypted TEXT,  -- For MVP, we'll store directly (TODO: Use Vault)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: execution_logs
-- Stores workflow execution history
CREATE TABLE IF NOT EXISTS execution_logs (
  run_id UUID PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  workflow_name VARCHAR(255),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  input_data JSONB,
  output_data JSONB,
  input_schema JSONB,
  output_schema JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_execution_logs_instance_id ON execution_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_workflow_id ON execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_instances_active ON instances(is_active) WHERE is_active = true;

-- Enable Row Level Security (for future multi-tenancy)
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow all access (no authentication)
-- TODO: Replace with proper policies when adding auth
CREATE POLICY "Allow all for MVP instances" ON instances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for MVP execution_logs" ON execution_logs FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- Uncomment to insert test instance
/*
INSERT INTO instances (name, url, api_key_encrypted, is_active)
VALUES (
    'Local n8n',
    'http://localhost:5678',
    'your-n8n-api-key',
    true
);
*/

-- Verify tables created
SELECT 'Instances table created' as message WHERE EXISTS (SELECT FROM instances LIMIT 1) OR NOT EXISTS (SELECT FROM instances LIMIT 1);
SELECT 'Execution logs table created' as message WHERE EXISTS (SELECT FROM execution_logs LIMIT 1) OR NOT EXISTS (SELECT FROM execution_logs LIMIT 1);
