-- Add status column to problems table
ALTER TABLE problems ADD COLUMN status TEXT DEFAULT 'processing';
