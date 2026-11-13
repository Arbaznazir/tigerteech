-- Clarify promo usage: reusable every order, once per user, or first N customers.

ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_usage_limit_type_check;

UPDATE promotions
SET usage_limit_type = 'unlimited'
WHERE usage_limit_type = 'all_users';

ALTER TABLE promotions
  ADD CONSTRAINT promotions_usage_limit_type_check
  CHECK (usage_limit_type IN ('unlimited', 'once_per_user', 'first_n'));

CREATE INDEX IF NOT EXISTS promotion_redemptions_user_promo_idx
  ON promotion_redemptions (promotion_id, user_id)
  WHERE user_id IS NOT NULL;
