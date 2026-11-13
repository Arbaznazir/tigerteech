-- Tigerteeh demo catalog seed (idempotent).
-- Product images use storefront public paths: /images/products/*.webp

BEGIN;

-- Categories (match storefront circles)
INSERT INTO categories (id, name, slug, image_url, sort_order, is_active) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Men', 'men', '/images/products/parrot.jpg', 10, TRUE),
  ('a1000000-0000-4000-8000-000000000002', 'Women', 'women', '/images/categories/women.png', 20, TRUE),
  ('a1000000-0000-4000-8000-000000000003', 'Co-ord Sets', 'co-ord-sets', '/images/products/serval.png', 30, TRUE),
  ('a1000000-0000-4000-8000-000000000004', 'Full Sleeve', 'full-sleeve', '/images/products/donkey.png', 40, TRUE),
  ('a1000000-0000-4000-8000-000000000005', 'New Arrivals', 'new-arrivals', '/images/products/goat.png', 50, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

-- Tags
INSERT INTO product_tags (id, slug, label, kind, accent) VALUES
  ('a3000000-0000-4000-8000-000000000001', 'bestseller', 'Bestseller', 'collection', ''),
  ('a3000000-0000-4000-8000-000000000002', 'new_arrival', 'New Arrival', 'collection', ''),
  ('a3000000-0000-4000-8000-000000000003', 'sale', 'Sale', 'deal_flag', ''),
  ('a3000000-0000-4000-8000-000000000004', 'popular', 'Popular', 'badge', '')
ON CONFLICT (slug) DO NOTHING;

-- Helper: upsert one clothing product with graph + image + variant
-- Products (18)
INSERT INTO products (
  id, name, slug, description, details_json, status, gender_fit,
  requires_shirt_meas, requires_trouser_meas, rating_avg, rating_count,
  listing_visibility, published_at, created_at, updated_at
) VALUES
(
  'a2000000-0000-4000-8000-000000000001',
  'Cheetah Co-ord Set',
  'cheetah-coord',
  'Bold cheetah-print co-ord — shirt + pants built for the wild side.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Cheetah"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Sand Cheetah","colorHex":"#C4A574","colorHex2":"#161412","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Cotton blend","price":89,"stock":48,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'women', TRUE, TRUE, 4.80, 42, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000002',
  'Leopard Lounge Set',
  'leopard-lounge',
  'Soft leopard lounge co-ord with sharp contrast piping.',
  '{"attributes":[{"key":"style","label":"Style","value":"Lounge"},{"key":"pattern","label":"Pattern","value":"Leopard"},{"key":"fit","label":"Fit","value":"Regular"}],"variantGraph":{"colors":[{"id":"c1","name":"Midnight Leopard","colorHex":"#161412","colorHex2":"#F38120","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Modal mix","price":96,"stock":40,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'women', TRUE, TRUE, 4.70, 31, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000003',
  'Zebra Strike Set',
  'zebra-strike-set',
  'High-contrast zebra print set for everyday bold.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Zebra"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Ink Zebra","colorHex":"#12100E","colorHex2":"#FAF9F7","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Jersey","price":78,"stock":55,"colorIds":["c1"],"maxPerOrder":4}]}}'::jsonb,
  'active', 'unisex', TRUE, TRUE, 4.60, 28, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000004',
  'Scarlet Macaw Overshirt',
  'scarlet-macaw-overshirt',
  'Vibrant macaw print overshirt — statement layering piece.',
  '{"attributes":[{"key":"style","label":"Style","value":"Overshirt"},{"key":"pattern","label":"Pattern","value":"Macaw"},{"key":"fit","label":"Fit","value":"Oversized"}],"variantGraph":{"colors":[{"id":"c1","name":"Scarlet","colorHex":"#E23D28","colorHex2":"#1B6CA8","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Poplin","price":72,"stock":36,"colorIds":["c1"],"maxPerOrder":2}]}}'::jsonb,
  'active', 'men', TRUE, FALSE, 4.90, 19, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000005',
  'Peacock Palazzo Pair',
  'peacock-palazzo',
  'Flowing peacock-print top with matching palazzo pants.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Peacock"},{"key":"bottom","label":"Bottom Style","value":"Palazzo"}],"variantGraph":{"colors":[{"id":"c1","name":"Peacock Blue","colorHex":"#0B3D5C","colorHex2":"#F38120","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Rayon","price":110,"stock":24,"colorIds":["c1"],"maxPerOrder":2}]}}'::jsonb,
  'active', 'women', TRUE, TRUE, 4.85, 22, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000006',
  'Giraffe Safari Co-ord',
  'giraffe-safari-coord',
  'Warm giraffe print co-ord for standout weekends.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Giraffe"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Savannah","colorHex":"#C4A574","colorHex2":"#3A3228","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Cotton blend","price":92,"stock":33,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'unisex', TRUE, TRUE, 4.55, 17, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000007',
  'Grizzly Trail Shirt',
  'grizzly-trail-shirt',
  'Earth-tone full sleeve shirt with heavyweight drape.',
  '{"attributes":[{"key":"style","label":"Style","value":"Shirt"},{"key":"pattern","label":"Pattern","value":"Solid"},{"key":"fit","label":"Fit","value":"Regular"}],"variantGraph":{"colors":[{"id":"c1","name":"Bark","colorHex":"#3A3228","colorHex2":"#C4A574","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Twill","price":68,"stock":44,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'men', TRUE, FALSE, 4.40, 15, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000008',
  'Blue Gold Macaw Set',
  'blue-gold-macaw-set',
  'Electric macaw print co-ord for nights that refuse quiet.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Macaw"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Blue Gold","colorHex":"#1B6CA8","colorHex2":"#F38120","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Cotton blend","price":98,"stock":29,"colorIds":["c1"],"maxPerOrder":2}]}}'::jsonb,
  'active', 'unisex', TRUE, TRUE, 4.75, 21, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000009',
  'African Grey Tee',
  'african-grey-tee',
  'Soft grey graphic tee with subtle feather motif.',
  '{"attributes":[{"key":"style","label":"Style","value":"Tee"},{"key":"pattern","label":"Pattern","value":"Graphic"},{"key":"neck","label":"Neck Type","value":"Crew"}],"variantGraph":{"colors":[{"id":"c1","name":"Ash","colorHex":"#6B6560","colorHex2":"#FAF9F7","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Jersey","price":42,"stock":80,"colorIds":["c1"],"maxPerOrder":5}]}}'::jsonb,
  'active', 'unisex', TRUE, FALSE, 4.35, 38, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000010',
  'Sun Conure Co-ord',
  'sun-conure-coord',
  'Bright sun-conure print set — heat in fabric form.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Conure"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Sunrise","colorHex":"#F38120","colorHex2":"#E23D28","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Rayon","price":94,"stock":27,"colorIds":["c1"],"maxPerOrder":2}]}}'::jsonb,
  'active', 'women', TRUE, TRUE, 4.65, 14, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000011',
  'Cobra Strike Pants',
  'cobra-strike-pants',
  'Scale-print trousers with a clean tapered cut.',
  '{"attributes":[{"key":"style","label":"Style","value":"Pants"},{"key":"pattern","label":"Pattern","value":"Cobra"},{"key":"bottom","label":"Bottom Style","value":"Tapered"}],"variantGraph":{"colors":[{"id":"c1","name":"Scale Black","colorHex":"#12100E","colorHex2":"#C4A574","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Tech weave","price":64,"stock":41,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'men', FALSE, TRUE, 4.50, 20, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000012',
  'Serval Full Sleeve',
  'serval-full-sleeve',
  'Full-sleeve serval print shirt for sharp layering.',
  '{"attributes":[{"key":"style","label":"Style","value":"Shirt"},{"key":"pattern","label":"Pattern","value":"Serval"},{"key":"fit","label":"Fit","value":"Regular"}],"variantGraph":{"colors":[{"id":"c1","name":"Serval Tan","colorHex":"#C4A574","colorHex2":"#161412","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Poplin","price":70,"stock":38,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'men', TRUE, FALSE, 4.45, 16, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000013',
  'Ocelot Night Co-ord',
  'ocelot-night-coord',
  'Dark ocelot print co-ord with soft stretch.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Ocelot"},{"key":"fit","label":"Fit","value":"Slim"}],"variantGraph":{"colors":[{"id":"c1","name":"Night Spot","colorHex":"#161412","colorHex2":"#F38120","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Modal mix","price":102,"stock":26,"colorIds":["c1"],"maxPerOrder":2}]}}'::jsonb,
  'active', 'women', TRUE, TRUE, 4.70, 12, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000014',
  'Alexandrine Resort Shirt',
  'alexandrine-resort-shirt',
  'Resort-weight shirt with alexandrine parrot print.',
  '{"attributes":[{"key":"style","label":"Style","value":"Shirt"},{"key":"pattern","label":"Pattern","value":"Parrot"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Leaf","colorHex":"#2F5D50","colorHex2":"#F38120","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Linen mix","price":74,"stock":34,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'men', TRUE, FALSE, 4.55, 18, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000015',
  'Parrot Jungle Set',
  'parrot-jungle-set',
  'Full parrot print co-ord — loud on purpose.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Parrot"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Jungle","colorHex":"#1B6CA8","colorHex2":"#E23D28","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Cotton blend","price":88,"stock":31,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'unisex', TRUE, TRUE, 4.60, 25, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000016',
  'Panda Soft Tee',
  'panda-soft-tee',
  'Cloud-soft tee with quiet panda graphic.',
  '{"attributes":[{"key":"style","label":"Style","value":"Tee"},{"key":"pattern","label":"Pattern","value":"Graphic"},{"key":"neck","label":"Neck Type","value":"Crew"}],"variantGraph":{"colors":[{"id":"c1","name":"Paper","colorHex":"#FAF9F7","colorHex2":"#12100E","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Jersey","price":38,"stock":90,"colorIds":["c1"],"maxPerOrder":5}]}}'::jsonb,
  'active', 'unisex', TRUE, FALSE, 4.30, 33, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000017',
  'Donkey Denim Shirt',
  'donkey-denim-shirt',
  'Washed full-sleeve shirt with utility pockets.',
  '{"attributes":[{"key":"style","label":"Style","value":"Shirt"},{"key":"pattern","label":"Pattern","value":"Solid"},{"key":"fit","label":"Fit","value":"Regular"}],"variantGraph":{"colors":[{"id":"c1","name":"Stone","colorHex":"#6B6560","colorHex2":"#C4A574","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Denim light","price":66,"stock":37,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'men', TRUE, FALSE, 4.25, 11, 'catalog', NOW(), NOW(), NOW()
),
(
  'a2000000-0000-4000-8000-000000000018',
  'Goat Trail Co-ord',
  'goat-trail-coord',
  'Mountain-ready co-ord in soft earth tones.',
  '{"attributes":[{"key":"style","label":"Style","value":"Co-ord"},{"key":"pattern","label":"Pattern","value":"Texture"},{"key":"fit","label":"Fit","value":"Relaxed"}],"variantGraph":{"colors":[{"id":"c1","name":"Trail","colorHex":"#3A3228","colorHex2":"#C4A574","colorStyle":"solid"}],"materials":[{"id":"m1","name":"Cotton blend","price":84,"stock":28,"colorIds":["c1"],"maxPerOrder":3}]}}'::jsonb,
  'active', 'unisex', TRUE, TRUE, 4.40, 13, 'catalog', NOW(), NOW(), NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  details_json = EXCLUDED.details_json,
  status = 'active',
  gender_fit = EXCLUDED.gender_fit,
  listing_visibility = 'catalog',
  published_at = COALESCE(products.published_at, EXCLUDED.published_at),
  updated_at = NOW();

-- Images
INSERT INTO product_images (id, product_id, url, sort_order, alt) VALUES
  ('a2100000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '/images/products/cheetah.webp', 0, 'Cheetah Co-ord Set'),
  ('a2100000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', '/images/products/leopard.webp', 0, 'Leopard Lounge Set'),
  ('a2100000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', '/images/products/zebra.webp', 0, 'Zebra Strike Set'),
  ('a2100000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', '/images/products/scarlet-macaw.webp', 0, 'Scarlet Macaw Overshirt'),
  ('a2100000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000005', '/images/products/peacock.webp', 0, 'Peacock Palazzo Pair'),
  ('a2100000-0000-4000-8000-000000000006', 'a2000000-0000-4000-8000-000000000006', '/images/products/giraffe.webp', 0, 'Giraffe Safari Co-ord'),
  ('a2100000-0000-4000-8000-000000000007', 'a2000000-0000-4000-8000-000000000007', '/images/products/grizzly-bear.webp', 0, 'Grizzly Trail Shirt'),
  ('a2100000-0000-4000-8000-000000000008', 'a2000000-0000-4000-8000-000000000008', '/images/products/blue-gold-macaw.webp', 0, 'Blue Gold Macaw Set'),
  ('a2100000-0000-4000-8000-000000000009', 'a2000000-0000-4000-8000-000000000009', '/images/products/african-grey.webp', 0, 'African Grey Tee'),
  ('a2100000-0000-4000-8000-000000000010', 'a2000000-0000-4000-8000-000000000010', '/images/products/sun-conure.webp', 0, 'Sun Conure Co-ord'),
  ('a2100000-0000-4000-8000-000000000011', 'a2000000-0000-4000-8000-000000000011', '/images/products/cobra.webp', 0, 'Cobra Strike Pants'),
  ('a2100000-0000-4000-8000-000000000012', 'a2000000-0000-4000-8000-000000000012', '/images/products/serval.png', 0, 'Serval Full Sleeve'),
  ('a2100000-0000-4000-8000-000000000013', 'a2000000-0000-4000-8000-000000000013', '/images/products/ocelot.png', 0, 'Ocelot Night Co-ord'),
  ('a2100000-0000-4000-8000-000000000014', 'a2000000-0000-4000-8000-000000000014', '/images/products/alexandrine-parrot.webp', 0, 'Alexandrine Resort Shirt'),
  ('a2100000-0000-4000-8000-000000000015', 'a2000000-0000-4000-8000-000000000015', '/images/products/parrot.jpg', 0, 'Parrot Jungle Set'),
  ('a2100000-0000-4000-8000-000000000016', 'a2000000-0000-4000-8000-000000000016', '/images/products/panda.png', 0, 'Panda Soft Tee'),
  ('a2100000-0000-4000-8000-000000000017', 'a2000000-0000-4000-8000-000000000017', '/images/products/donkey.png', 0, 'Donkey Denim Shirt'),
  ('a2100000-0000-4000-8000-000000000018', 'a2000000-0000-4000-8000-000000000018', '/images/products/goat.png', 0, 'Goat Trail Co-ord')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, sort_order = EXCLUDED.sort_order;

-- Variants (sellable rows)
INSERT INTO product_variants (
  id, product_id, sku, color_name, color_hex, size_label, material_name,
  price, compare_at_price, stock, max_per_order, is_active
) VALUES
  ('a2200000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'TT-CHEETAH', 'Sand Cheetah', '#C4A574', 'One Size', 'Cotton blend', 89, 119, 48, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'TT-LEOPARD', 'Midnight Leopard', '#161412', 'One Size', 'Modal mix', 96, 129, 40, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', 'TT-ZEBRA', 'Ink Zebra', '#12100E', 'One Size', 'Jersey', 78, 99, 55, 4, TRUE),
  ('a2200000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', 'TT-MACAW', 'Scarlet', '#E23D28', 'L', 'Poplin', 72, 95, 36, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000005', 'TT-PEACOCK', 'Peacock Blue', '#0B3D5C', 'One Size', 'Rayon', 110, 145, 24, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000006', 'a2000000-0000-4000-8000-000000000006', 'TT-GIRAFFE', 'Savannah', '#C4A574', 'One Size', 'Cotton blend', 92, 120, 33, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000007', 'a2000000-0000-4000-8000-000000000007', 'TT-GRIZZLY', 'Bark', '#3A3228', 'L', 'Twill', 68, 88, 44, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000008', 'a2000000-0000-4000-8000-000000000008', 'TT-BG-MACAW', 'Blue Gold', '#1B6CA8', 'One Size', 'Cotton blend', 98, 128, 29, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000009', 'a2000000-0000-4000-8000-000000000009', 'TT-AGREY', 'Ash', '#6B6560', 'M', 'Jersey', 42, 55, 80, 5, TRUE),
  ('a2200000-0000-4000-8000-000000000010', 'a2000000-0000-4000-8000-000000000010', 'TT-CONURE', 'Sunrise', '#F38120', 'One Size', 'Rayon', 94, 125, 27, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000011', 'a2000000-0000-4000-8000-000000000011', 'TT-COBRA', 'Scale Black', '#12100E', 'M', 'Tech weave', 64, 84, 41, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000012', 'a2000000-0000-4000-8000-000000000012', 'TT-SERVAL', 'Serval Tan', '#C4A574', 'L', 'Poplin', 70, 90, 38, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000013', 'a2000000-0000-4000-8000-000000000013', 'TT-OCELOT', 'Night Spot', '#161412', 'One Size', 'Modal mix', 102, 135, 26, 2, TRUE),
  ('a2200000-0000-4000-8000-000000000014', 'a2000000-0000-4000-8000-000000000014', 'TT-ALEX', 'Leaf', '#2F5D50', 'L', 'Linen mix', 74, 98, 34, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000015', 'a2000000-0000-4000-8000-000000000015', 'TT-PARROT', 'Jungle', '#1B6CA8', 'One Size', 'Cotton blend', 88, 115, 31, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000016', 'a2000000-0000-4000-8000-000000000016', 'TT-PANDA', 'Paper', '#FAF9F7', 'M', 'Jersey', 38, 48, 90, 5, TRUE),
  ('a2200000-0000-4000-8000-000000000017', 'a2000000-0000-4000-8000-000000000017', 'TT-DONKEY', 'Stone', '#6B6560', 'L', 'Denim light', 66, 85, 37, 3, TRUE),
  ('a2200000-0000-4000-8000-000000000018', 'a2000000-0000-4000-8000-000000000018', 'TT-GOAT', 'Trail', '#3A3228', 'One Size', 'Cotton blend', 84, 110, 28, 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  stock = EXCLUDED.stock,
  is_active = TRUE;

-- Category links
INSERT INTO product_categories (product_id, category_id) VALUES
  -- Men
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000001'),
  -- Women
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002'),
  ('a2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000002'),
  -- Co-ord sets
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000003'),
  ('a2000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000003'),
  -- Full sleeve
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('a2000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004'),
  ('a2000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000004'),
  ('a2000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000004'),
  ('a2000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000004'),
  -- New arrivals
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000005'),
  ('a2000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000005')
ON CONFLICT DO NOTHING;

-- Bestsellers / new arrivals tags
INSERT INTO product_tag_map (product_id, tag_id)
SELECT p.id, t.id
FROM (VALUES
  ('a2000000-0000-4000-8000-000000000001', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000002', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000003', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000005', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000006', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000008', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000015', 'bestseller'),
  ('a2000000-0000-4000-8000-000000000004', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000009', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000010', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000012', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000013', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000014', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000016', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000018', 'new_arrival'),
  ('a2000000-0000-4000-8000-000000000001', 'sale')
) AS x(product_id, tag_slug)
JOIN products p ON p.id = x.product_id::uuid
JOIN product_tags t ON t.slug = x.tag_slug
ON CONFLICT DO NOTHING;

-- Live deal
INSERT INTO deals (
  id, title, slug, discount_type, discount_value,
  starts_at, ends_at, countdown_enabled, is_active, scope,
  banner_json, geo_everywhere, geo_json
) VALUES (
  'a4000000-0000-4000-8000-000000000001',
  'Wild Week — 15% Off',
  'wild-week-15',
  'percent', 15,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  TRUE, TRUE, 'platform',
  '{"headline":"WILD WEEK","sub":"15% off sitewide","cta":"Shop the deal"}'::jsonb,
  TRUE, '[]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  discount_value = EXCLUDED.discount_value,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_active = TRUE,
  banner_json = EXCLUDED.banner_json,
  geo_everywhere = TRUE;

-- Promos
INSERT INTO promotions (
  id, kind, code, title, description, discount_type, discount_value,
  scope, min_subtotal, usage_limit_type, usage_limit_count,
  starts_at, ends_at, is_active, card_style, created_at, updated_at
) VALUES
(
  'a5000000-0000-4000-8000-000000000001',
  'coupon', 'WILD10', 'Welcome 10%', '10% off your cart.',
  'percent', 10, 'cart', 0, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE, 'ember', NOW(), NOW()
),
(
  'a5000000-0000-4000-8000-000000000002',
  'promo', 'BOLD20', 'Bold Drop $20 Off', 'Flat $20 off orders over $120.',
  'fixed', 20, 'cart', 120, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', TRUE, 'midnight', NOW(), NOW()
),
(
  'a5000000-0000-4000-8000-000000000003',
  'offer', '', 'Free gift over $150', 'Unlock a surprise add-on at $150.',
  'gift_threshold', 0, 'cart', 150, 'unlimited', 0,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', TRUE, 'gold', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = TRUE,
  ends_at = EXCLUDED.ends_at,
  updated_at = NOW();

INSERT INTO platform_settings (key, value_json, updated_at)
VALUES (
  'cod',
  '{"enabled":true,"everywhere":false,"rules":[{"scope":"country","countryIso":"IN","countryName":"India","states":[]},{"scope":"states","countryIso":"US","countryName":"United States","states":["New York","California","Texas"],"stateIsos":["NY","CA","TX"]}]}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

COMMIT;
