-- Migration: Rename apps to dashboards
-- Run this in Supabase SQL Editor to update existing tables

-- Step 1: Rename tables
ALTER TABLE IF EXISTS apps RENAME TO dashboards;
ALTER TABLE IF EXISTS app_fields RENAME TO dashboard_fields;

-- Step 2: Update foreign key column name in dashboard_fields
-- PostgreSQL allows renaming columns directly
ALTER TABLE IF EXISTS dashboard_fields 
  RENAME COLUMN app_id TO dashboard_id;

-- Step 3: Verify the changes
SELECT 'Migration complete!' as status;
SELECT 'Dashboards table:' as info, COUNT(*) as count FROM dashboards;
SELECT 'Dashboard fields table:' as info, COUNT(*) as count FROM dashboard_fields;
