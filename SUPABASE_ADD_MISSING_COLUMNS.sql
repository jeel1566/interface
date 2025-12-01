-- Add missing columns to execution_logs table
-- Run this to fix the existing database

-- Add input_schema column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'execution_logs' AND column_name = 'input_schema'
    ) THEN
        ALTER TABLE execution_logs ADD COLUMN input_schema JSONB;
        RAISE NOTICE 'Added input_schema column';
    ELSE
        RAISE NOTICE 'input_schema column already exists';
    END IF;
END $$;

-- Add output_schema column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'execution_logs' AND column_name = 'output_schema'
    ) THEN
        ALTER TABLE execution_logs ADD COLUMN output_schema JSONB;
        RAISE NOTICE 'Added output_schema column';
    ELSE
        RAISE NOTICE 'output_schema column already exists';
    END IF;
END $$;

-- Verify the columns exist
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'execution_logs' 
  AND column_name IN ('input_schema', 'output_schema')
ORDER BY column_name;
