-- Add missing full_name and avatar_url columns to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Populate full_name from students table (first_name + last_name)
UPDATE users u
SET full_name = TRIM(
  COALESCE((SELECT s.first_name FROM students s WHERE s.user_id = u.id), '') || ' ' ||
  COALESCE((SELECT s.last_name FROM students s WHERE s.user_id = u.id), '')
)
WHERE u.role = 'student' AND u.full_name IS NULL;

-- Populate full_name from faculty table
UPDATE users u
SET full_name = TRIM(
  COALESCE((SELECT f.first_name FROM faculty f WHERE f.user_id = u.id), '') || ' ' ||
  COALESCE((SELECT f.last_name FROM faculty f WHERE f.user_id = u.id), '')
)
WHERE u.role IN ('faculty', 'hod') AND u.full_name IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
