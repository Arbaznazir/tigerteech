-- Animated card style for storefront promo / coupon tiles.
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS card_style TEXT NOT NULL DEFAULT 'ember';
