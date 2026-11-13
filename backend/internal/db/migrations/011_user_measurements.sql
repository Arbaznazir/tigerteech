ALTER TABLE users
  ADD COLUMN IF NOT EXISTS measurements_json JSONB NOT NULL DEFAULT '[]'::jsonb;
