-- Tigerteeh demo seed (idempotent). Safe to re-run against Supabase or local Postgres.
-- Images point at storefront public assets: /images/products/*.webp

BEGIN;

-- Categories
INSERT INTO categories (id, name, slug, image_url, sort_order, is_active)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Women', 'women', '/images/categories/women.png', 10, TRUE),
  ('a1000000-0000-4000-8000-000000000002', 'Men', 'men', '/images/products/scarlet-macaw.webp', 20, TRUE),
  ('a1000000-0000-4000-8000-000000000003', 'Co-ords', 'co-ords', '/images/products/cheetah.webp', 30, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Products (variantGraph lives in details_json; listing variants below for price/stock)
INSERT INTO products (
  id, name, slug, description, details_json, status, gender_fit,
  requires_shirt_meas, requires_trouser_meas, rating_avg, rating_count,
  listing_visibility, published_at, created_at, updated_at
) VALUES
(
  'a2000000-0000-4000-8000-000000000001',
  'Cheetah Co-ord Set',
  'cheetah-coord',
  'Bold cheetah print co-ord — built for the wild side.',
  '{
    "attributes": [
      {"key":"style","label":"Style","value":"Co-ord"},
      {"key":"pattern","label":"Pattern","value":"Cheetah"},
      {"key":"fit","label":"Fit","value":"Relaxed"}
    ],
    "variantGraph": {
      "colors": [
        {"id":"c_cheetah","name":"Sand Cheetah","colorHex":"#C4A574","colorHex2":"#161412","colorStyle":"solid"}
      ],
      "materials": [
        {"id":"m_cotton","name":"Cotton blend","price":89,"stock":40,"colorIds":["c_cheetah"],"maxPerOrder":3}
      ]
    }
  }'::jsonb,
  'active', 'women', TRUE, TRUE, 4.80, 24, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000002',
  'Leopard Lounge Set',
  'leopard-lounge',
  'Soft leopard print set with sharp contrast piping.',
  '{
    "attributes": [
      {"key":"style","label":"Style","value":"Lounge"},
      {"key":"pattern","label":"Pattern","value":"Leopard"},
      {"key":"fit","label":"Fit","value":"Regular"}
    ],
    "variantGraph": {
      "colors": [
        {"id":"c_leopard","name":"Midnight Leopard","colorHex":"#161412","colorHex2":"#F38120","colorStyle":"solid"}
      ],
      "materials": [
        {"id":"m_modal","name":"Modal mix","price":96,"stock":35,"colorIds":["c_leopard"],"maxPerOrder":3}
      ]
    }
  }'::jsonb,
  'active', 'women', TRUE, TRUE, 4.70, 18, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000003',
  'Zebra Strike Tee',
  'zebra-strike-tee',
  'High-contrast zebra graphic tee for everyday bold.',
  '{
    "attributes": [
      {"key":"style","label":"Style","value":"Tee"},
      {"key":"pattern","label":"Pattern","value":"Zebra"},
      {"key":"neck","label":"Neck Type","value":"Crew"}
    ],
    "variantGraph": {
      "colors": [
        {"id":"c_zebra","name":"Ink Zebra","colorHex":"#12100E","colorHex2":"#FAF9F7","colorStyle":"solid"}
      ],
      "materials": [
        {"id":"m_jersey","name":"Jersey","price":42,"stock":80,"colorIds":["c_zebra"],"maxPerOrder":5}
      ]
    }
  }'::jsonb,
  'active', 'unisex', TRUE, FALSE, 4.60, 41, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000004',
  'Scarlet Macaw Shirt',
  'scarlet-macaw-shirt',
  'Vibrant macaw print overshirt — statement piece.',
  '{
    "attributes": [
      {"key":"style","label":"Style","value":"Overshirt"},
      {"key":"pattern","label":"Pattern","value":"Macaw"},
      {"key":"fit","label":"Fit","value":"Oversized"}
    ],
    "variantGraph": {
      "colors": [
        {"id":"c_macaw","name":"Scarlet","colorHex":"#E23D28","colorHex2":"#1B6CA8","colorStyle":"solid"}
      ],
      "materials": [
        {"id":"m_poplin","name":"Poplin","price":78,"stock":28,"colorIds":["c_macaw"],"maxPerOrder":2}
      ]
    }
  }'::jsonb,
  'active', 'men', TRUE, FALSE, 4.90, 12, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000005',
  'Peacock Palazzo Pair',
  'peacock-palazzo',
  'Flowing peacock-print top + palazzo set.',
  '{
    "attributes": [
      {"key":"style","label":"Style","value":"Co-ord"},
      {"key":"pattern","label":"Pattern","value":"Peacock"},
      {"key":"bottom","label":"Bottom Style","value":"Palazzo"}
    ],
    "variantGraph": {
      "colors": [
        {"id":"c_peacock","name":"Peacock Blue","colorHex":"#0B3D5C","colorHex2":"#F38120","colorStyle":"solid"}
      ],
      "materials": [
        {"id":"m_rayon","name":"Rayon","price":110,"stock":22,"colorIds":["c_peacock"],"maxPerOrder":2}
      ]
    }
  }'::jsonb,
  'active', 'women', TRUE, TRUE, 4.85, 9, 'catalog', NOW(), NOW(), NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  details_json = EXCLUDED.details_json,
  status = EXCLUDED.status,
  gender_fit = EXCLUDED.gender_fit,
  listing_visibility = EXCLUDED.listing_visibility,
  published_at = COALESCE(products.published_at, EXCLUDED.published_at),
  updated_at = NOW();

-- Product images (storefront public paths)
INSERT INTO product_images (id, product_id, url, sort_order, alt) VALUES
  ('a2100000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '/images/products/cheetah.webp', 0, 'Cheetah Co-ord'),
  ('a2100000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', '/images/products/leopard.webp', 0, 'Leopard Lounge'),
  ('a2100000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', '/images/products/zebra.webp', 0, 'Zebra Tee'),
  ('a2100000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', '/images/products/scarlet-macaw.webp', 0, 'Scarlet Macaw Shirt'),
  ('a2100000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000005', '/images/products/peacock.webp', 0, 'Peacock Palazzo')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, sort_order = EXCLUDED.sort_order;

-- Variants (one sellable row per product)
INSERT INTO product_variants (
  id, product_id, sku, color_name, color_hex, size_label, material_name,
  price, compare_at_price, stock, max_per_order, is_active
) VALUES
  ('a2200000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'TT-CHEETAH-OS', 'Sand Cheetah', '#C4A574', 'One Size', 'Cotton blend', 89, 119, 40, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'TT-LEOPARD-OS', 'Midnight Leopard', '#161412', 'One Size', 'Modal mix', 96, 129, 35, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', 'TT-ZEBRA-M', 'Ink Zebra', '#12100E', 'M', 'Jersey', 42, 55, 80, 5, TRUE),
  ('a2200000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', 'TT-MACAW-L', 'Scarlet', '#E23D28', 'L', 'Poplin', 78, 98, 28, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000005', 'TT-PEACOCK-OS', 'Peacock Blue', '#0B3D5C', 'One Size', 'Rayon', 110, 145, 22, 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  stock = EXCLUDED.stock,
  is_active = EXCLUDED.is_active;

-- Category links
INSERT INTO product_categories (product_id, category_id) VALUES
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;

-- Tags (API also seeds these; map bestsellers / new arrivals)
INSERT INTO product_tags (id, slug, label, kind, accent) VALUES
  ('a3000000-0000-4000-8000-000000000001', 'bestseller', 'Bestseller', 'collection', ''),
  ('a3000000-0000-4000-8000-000000000002', 'new_arrival', 'New Arrival', 'collection', ''),
  ('a3000000-0000-4000-8000-000000000003', 'sale', 'Sale', 'deal_flag', '')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_tag_map (product_id, tag_id)
SELECT p.id, t.id
FROM (VALUES
  ('a2000000-0000-4000-8000-000000000001', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000002', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000003', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000004', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000005', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000001', 'sale')
) AS x(product_id, tag_slug)
JOIN products p ON p.id = x.product_id::uuid
JOIN product_tags t ON t.slug = x.tag_slug
ON CONFLICT DO NOTHING;

-- Platform deal (everywhere, 15% off, countdown)
INSERT INTO deals (
  id, title, slug, discount_type, discount_value,
  starts_at, ends_at, countdown_enabled, is_active, scope,
  banner_json, geo_everywhere, geo_json
) VALUES (
  'a4000000-0000-4000-8000-000000000001',
  'Wild Week — 15% Off',
  'wild-week-15',
  'percent',
  15,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  TRUE,
  TRUE,
  'platform',
  '{"headline":"WILD WEEK","sub":"15% off sitewide","cta":"Shop the deal"}'::jsonb,
  TRUE,
  '[]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_active = TRUE,
  banner_json = EXCLUDED.banner_json,
  geo_everywhere = TRUE;

-- Promotions / offers strip
INSERT INTO promotions (
  id, kind, code, title, description, discount_type, discount_value,
  scope, min_subtotal, usage_limit_type, usage_limit_count,
  starts_at, ends_at, is_active, card_style, created_at, updated_at
) VALUES
(
  'a5000000-0000-4000-8000-000000000001',
  'coupon',
  'WILD10',
  'Welcome 10%',
  'First-order style perk — 10% off your cart.',
  'percent', 10, 'cart', 0, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE, 'ember', NOW(), NOW()
),
(
  'a5000000-0000-4000-8000-000000000002',
  'promo',
  'BOLD20',
  'Bold Drop $20 Off',
  'Flat $20 off orders over $120.',
  'fixed', 20, 'cart', 120, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', TRUE, 'midnight', NOW(), NOW()
),
(
  'a5000000-0000-4000-8000-000000000003',
  'offer',
  '',
  'Free gift over $150',
  'Unlock a surprise add-on when your bag hits $150.',
  'gift_threshold', 0, 'cart', 150, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', TRUE, 'gold', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_subtotal = EXCLUDED.min_subtotal,
  is_active = TRUE,
  card_style = EXCLUDED.card_style,
  ends_at = EXCLUDED.ends_at,
  updated_at = NOW();

-- COD defaults (India + sample US states) if missing
INSERT INTO platform_settings (key, value_json, updated_at)
VALUES (
  'cod',
  '{
    "enabled": true,
    "everywhere": false,
    "rules": [
      {"scope":"country","countryIso":"IN","countryName":"India","states":[]},
      {"scope":"states","countryIso":"US","countryName":"United States","states":["New York","California","Texas"],"stateIsos":["NY","CA","TX"]}
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

COMMIT;
