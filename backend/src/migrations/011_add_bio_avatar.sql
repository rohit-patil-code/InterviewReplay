-- Add bio and avatar_url to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024);
