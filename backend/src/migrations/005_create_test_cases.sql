CREATE TYPE test_case_type AS ENUM ('standard', 'edge', 'large_tle');

CREATE TABLE test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  type test_case_type NOT NULL,
  
  -- For Small / Edge Cases (Stored directly in DB)
  input_data TEXT, 
  expected_output TEXT,
  
  -- For Large / TLE Cases (Stored in Supabase Storage)
  input_file_url VARCHAR(255),
  output_file_url VARCHAR(255),
  
  -- Metadata
  is_hidden BOOLEAN DEFAULT true, -- Keep true so users can't cheat
  points_weight INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups when evaluating code
CREATE INDEX idx_test_cases_problem_id ON test_cases(problem_id);
