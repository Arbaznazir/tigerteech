-- Deal geo targeting: everywhere, or country / state rules (same shape as COD).
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS geo_everywhere BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS geo_json JSONB NOT NULL DEFAULT '[]'::jsonb;
