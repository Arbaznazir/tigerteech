-- Fast product search: trigram fuzzy + full-text ranking

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

UPDATE products SET search_tsv =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
WHERE search_tsv IS NULL;

CREATE OR REPLACE FUNCTION products_search_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_tsv ON products;
CREATE TRIGGER trg_products_search_tsv
  BEFORE INSERT OR UPDATE OF name, description ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_tsv_trigger();

CREATE INDEX IF NOT EXISTS idx_products_search_tsv
  ON products USING GIN (search_tsv);

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_status_created
  ON products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_tag_map_tag
  ON product_tag_map (tag_id, product_id);

CREATE INDEX IF NOT EXISTS idx_product_tag_map_product
  ON product_tag_map (product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_category
  ON product_categories (category_id, product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_product
  ON product_categories (product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_product_tags_slug
  ON product_tags (slug);
