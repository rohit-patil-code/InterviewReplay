-- Add AI-generated per-problem time limit (Java baseline in ms)
ALTER TABLE problems ADD COLUMN IF NOT EXISTS time_limit_ms INTEGER DEFAULT 2000;
