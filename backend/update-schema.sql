-- Add the model column to the robots table
-- Use the Supabase SQL editor or run via psql/pgAdmin
ALTER TABLE robots ADD COLUMN IF NOT EXISTS model VARCHAR(255) DEFAULT 'Standard Unit';
