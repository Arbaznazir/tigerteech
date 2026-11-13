ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
