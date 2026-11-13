ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS material_name TEXT NOT NULL DEFAULT '';
