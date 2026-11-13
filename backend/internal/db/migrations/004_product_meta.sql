-- Allow PDP feature/highlight tags alongside collection badges.
ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_kind_check;
ALTER TABLE product_tags
  ADD CONSTRAINT product_tags_kind_check
  CHECK (kind IN ('badge', 'collection', 'deal_flag', 'highlight'));

ALTER TABLE product_tags
  ADD COLUMN IF NOT EXISTS accent TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS product_detail_fields (
  id UUID PRIMARY KEY,
  field_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
