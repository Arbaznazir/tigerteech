-- Tigerteeh initial schema

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  gender_fit TEXT NOT NULL DEFAULT 'unisex' CHECK (gender_fit IN ('men', 'women', 'unisex')),
  requires_shirt_meas BOOLEAN NOT NULL DEFAULT TRUE,
  requires_trouser_meas BOOLEAN NOT NULL DEFAULT TRUE,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL DEFAULT '',
  color_name TEXT NOT NULL DEFAULT '',
  color_hex TEXT NOT NULL DEFAULT '#000000',
  size_label TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  stock INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'badge' CHECK (kind IN ('badge', 'collection', 'deal_flag'))
);

CREATE TABLE IF NOT EXISTS product_tag_map (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS banner_slots (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  screenshot_desktop_url TEXT NOT NULL DEFAULT '',
  screenshot_mobile_url TEXT NOT NULL DEFAULT '',
  aspect_hint_desktop TEXT NOT NULL DEFAULT '',
  aspect_hint_mobile TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY,
  slot_key TEXT NOT NULL REFERENCES banner_slots(key) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '/shop',
  image_desktop_url TEXT NOT NULL DEFAULT '',
  image_mobile_url TEXT NOT NULL DEFAULT '',
  object_position_desktop TEXT NOT NULL DEFAULT 'center',
  object_position_mobile TEXT NOT NULL DEFAULT 'center',
  copy_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  countdown_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_products (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, product_id)
);

CREATE TABLE IF NOT EXISTS measurement_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  sex TEXT NOT NULL DEFAULT 'male',
  unit TEXT NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm', 'in')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurement_values (
  profile_id UUID NOT NULL REFERENCES measurement_profiles(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value_numeric NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (profile_id, field_key)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'INR',
  email TEXT NOT NULL DEFAULT '',
  shipping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  totals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurement_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  qty INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  measurement_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_banners_slot ON banners(slot_key, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
