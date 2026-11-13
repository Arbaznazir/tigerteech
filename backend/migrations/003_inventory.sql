ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS max_per_order INT NOT NULL DEFAULT 5;

UPDATE product_variants
SET max_per_order = 5
WHERE max_per_order IS NULL OR max_per_order < 1;

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
