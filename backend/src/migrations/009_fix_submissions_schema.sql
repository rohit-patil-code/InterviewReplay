-- Rename created_at to submitted_at for submissions and ensure correct defaults
ALTER TABLE submissions RENAME COLUMN created_at TO submitted_at;
ALTER TABLE submissions ALTER COLUMN submitted_at SET DEFAULT now();

-- Recreate index on the new column
DROP INDEX IF EXISTS idx_submissions_created_at;
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
