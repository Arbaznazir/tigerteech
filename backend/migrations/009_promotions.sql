-- Coupons / promos / threshold gift offers (separate from deals)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS listing_visibility TEXT NOT NULL DEFAULT 'catalog';

DO $$ BEGIN
  ALTER TABLE products
    ADD CONSTRAINT products_listing_visibility_check
    CHECK (listing_visibility IN ('catalog', 'offer_gift', 'hidden'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('coupon', 'promo', 'offer')),
  code TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'gift_threshold')),
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'cart' CHECK (scope IN ('cart', 'product')),
  min_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  usage_limit_type TEXT NOT NULL DEFAULT 'unlimited'
    CHECK (usage_limit_type IN ('unlimited', 'first_n', 'all_users')),
  usage_limit_count INT NOT NULL DEFAULT 0,
  redemption_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS promotions_code_unique
  ON promotions (LOWER(code))
  WHERE code <> '';

CREATE INDEX IF NOT EXISTS promotions_active_idx
  ON promotions (is_active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id UUID PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID,
  code TEXT NOT NULL DEFAULT '',
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promotion_redemptions_promo_idx
  ON promotion_redemptions (promotion_id, created_at DESC);
