-- Deal strip: scope + category links + banner style JSON
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'platform';

ALTER TABLE deals
  DROP CONSTRAINT IF EXISTS deals_scope_check;

ALTER TABLE deals
  ADD CONSTRAINT deals_scope_check
  CHECK (scope IN ('platform', 'category', 'products'));

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS banner_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS deal_categories (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, category_id)
);
