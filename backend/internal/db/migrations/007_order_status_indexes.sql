-- Order lifecycle statuses + performance indexes (no N+1 helpers)

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'accepted',
    'out_for_delivery',
    'delivered',
    'rejected',
    'refunded'
  ));

-- Hot paths: status filters, payment filters, date range, customer history
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_method_created
  ON orders (payment_method, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_payment_created
  ON orders (status, payment_method, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id
  ON order_items (variant_id)
  WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_images_product_sort
  ON product_images (product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_users_role_created
  ON users (role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (lower(email));
