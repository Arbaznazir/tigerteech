ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT ''
  CHECK (gender IN ('', 'male', 'female'));
