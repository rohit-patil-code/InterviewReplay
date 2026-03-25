-- Add display name fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS display_name_last_changed_at TIMESTAMP;
