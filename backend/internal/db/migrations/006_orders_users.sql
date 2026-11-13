-- User profile fields + richer order payment / admin status
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod';

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'online'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT NOT NULL DEFAULT '';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_note TEXT NOT NULL DEFAULT '';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
