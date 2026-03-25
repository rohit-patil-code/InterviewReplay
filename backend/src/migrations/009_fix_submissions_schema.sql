-- Safe rename: only rename if created_at still exists (idempotent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'submissions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE submissions RENAME COLUMN created_at TO submitted_at;
    END IF;
END $$;

ALTER TABLE submissions ALTER COLUMN submitted_at SET DEFAULT now();

-- Recreate index on the new column
DROP INDEX IF EXISTS idx_submissions_created_at;
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
