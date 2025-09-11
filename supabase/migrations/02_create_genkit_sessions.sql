CREATE TABLE genkit_sessions (
  session_id TEXT PRIMARY KEY,
  session_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
