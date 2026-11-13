# Tigerteeh — Backend, Admin & Measurements Plan

> Living plan for replacing the mock storefront with a real API + seller admin.
> Implement after this doc is agreed. Screenshots of tailor measurements (live site) and Speedykart admin UX are referenced below.

---

## 1. Goal

Build a **working end-to-end system**:

| Surface | Role |
|---------|------|
| `frontend/` | Customer storefront — reads **real** catalog, banners, deals, cart → checkout with **body measurements** |
| `admin/` | Seller / ops dashboard — products, categories, banners, tags, deals, orders, measurements |
| `backend/` | Single API + DB + media pipeline (WebP) |

Remove dummy `products.ts` / localStorage commerce once APIs are live. Keep Midnight Tiger design on the storefront; admin can be denser/ops-focused (Speedykart-style), still on-brand.

---

## 2. Language & stack (recommendation)

### Backend: **Go**

**Why Go (not Node “because admin is TS”, not .NET like Speedykart):**

- Fast, single binary deploy — good for a small team and VPS/Docker.
- Excellent for file upload → image convert → object storage pipelines.
- Clear module layout for products / orders / media without Speedykart’s multi-tenant complexity.
- You asked for Go; it fits this shop size better than copying Speedykart’s .NET stack wholesale.

**Alternatives considered:** NestJS (faster shared types with admin) — fine if you prefer one language everywhere. Speedykart’s .NET — only if you want to reuse that codebase/team skills. **Default for Tigerteeh: Go.**

### Supporting stack

| Layer | Choice |
|-------|--------|
| API | Go (`chi` or `echo`) + OpenAPI |
| DB | **PostgreSQL** |
| Auth | JWT (admin + customer), refresh tokens optional v2 |
| Media | Local disk → later S3/R2; **all images → WebP** on upload (`cwebp` / `libwebp`) |
| Admin UI | Next.js in `admin/` (already scaffolded, port **3001**) |
| Storefront | Next.js in `frontend/` (port **3000**) |
| Payments | Mock / COD first; Stripe/Razorpay later |

---

## 3. Monorepo layout (target)

```text
tigerteehcloothing/                 ← git root (unchanged)
├── docs/
│   └── BACKEND_AND_ADMIN_PLAN.md   ← this file
├── frontend/                       ← customer shop
├── admin/                          ← seller dashboard
├── backend/                        ← Go API
│   ├── cmd/api/
│   ├── internal/
│   │   ├── auth/
│   │   ├── catalog/                ← products, categories, tags, variants
│   │   ├── marketing/              ← banners, deals, countdowns
│   │   ├── orders/
│   │   ├── measurements/
│   │   ├── media/                  ← upload + WebP
│   │   └── http/
│   ├── migrations/
│   └── uploads/                    ← gitignored
└── package.json                    ← root scripts only
```

Speedykart reference (UX / flows only, not a code copy):

- Docs: `~/My Projects/Speedykart/docs/03_ADMIN_PANEL_FLOWS.md` (§3d products, §3g banners)
- UI patterns: `speedykart_frontend` admin product + banner pages
- Tigerteeh is **simpler**: one brand, custom-tailored apparel, no multi-seller / delivery riders

---

## 4. Storefront map → what admin must drive

Homepage today (hardcoded) must become API-driven:

| Section | Admin controls |
|---------|----------------|
| Hero slider | Banners: position `hero`, desktop + mobile assets, copy fields, order, active |
| Category circles | Categories: name, slug, image, sort, visible |
| Bestsellers carousel | Products tagged `bestseller` / collection rules |
| Limited Collection promo | Banner position `promo_mid` (+ optional countdown deal) |
| New Arrivals carousel | Products tagged `new_arrival` or `published_at` window |
| Instagram strip | Optional later; or static CMS block |
| Shop / PDP / search | Full catalog + variants |
| Cart → Checkout | Address + **mandatory measurements** + order create |

---

## 5. Domain model (core tables)

### 5.1 Catalog

```text
categories
  id, name, slug, image_url, sort_order, is_active, created_at

products
  id, name, slug, description, details_json, status (draft|active|archived)
  gender_fit (men|women|unisex), requires_shirt_meas, requires_trouser_meas
  rating_avg, rating_count, published_at, created_at

product_images
  id, product_id, url, sort_order, alt

product_variants
  id, product_id, sku, color_name, color_hex, size_label (optional if made-to-measure)
  price, compare_at_price, stock (nullable if always MTO), is_active

product_tags
  id, slug, label, kind (badge|collection|deal_flag)
  -- e.g. bestseller, new_arrival, popular, sale

product_tag_map
  product_id, tag_id
```

**Variants:** one product → many rows mapping **color (shade) × optional size × price**.  
If everything is made-to-measure, “size” may be informational only; **price is still per color/shade** (and can differ).

### 5.2 Marketing

```text
banner_slots          -- fixed placement catalog
  key (hero|promo_mid|instagram|…), label, description
  screenshot_desktop_url, screenshot_mobile_url   -- “at this place, this banner”
  aspect_hint_desktop, aspect_hint_mobile

banners
  id, slot_key, title, subtitle, cta_label, cta_href
  image_desktop_url, image_mobile_url
  object_position_desktop, object_position_mobile
  copy_json (eyebrow, lead, accent, trail, align, light_veil, …)
  sort_order, is_active, starts_at, ends_at

deals
  id, title, slug, discount_type (percent|fixed), discount_value
  starts_at, ends_at, countdown_enabled, is_active
  -- products via deal_products
```

Admin UI shows each `banner_slots` row with **placement screenshot** so operators know “this is the homepage hero” vs “mid-page Limited Collection.”

### 5.3 Customers, measurements, orders

```text
users
  id, email, password_hash, name, phone, role (customer|admin), created_at

measurement_profiles
  id, user_id, person_name, sex (male|female|other), unit (cm|in)
  is_default, notes, created_at, updated_at

measurement_values
  profile_id, field_key, value_numeric
  -- field_key from schema below

orders
  id, user_id (nullable guest), status, currency
  shipping_json, totals_json, measurement_profile_id (snapshot FK or embedded JSON)
  created_at

order_items
  id, order_id, product_id, variant_id, qty, unit_price
  measurement_snapshot_json   -- freeze values at purchase time
```

**Checkout rule:** cart cannot place order without a complete measurement set covering every required field for items in the cart (shirt and/or trouser, from product flags).

---

## 6. Tailor measurements (from your screenshots)

### 6.1 UX (storefront)

Mirror live Tigerteeh flow:

1. Cart → Checkout → **“Add Tailor Measurements”** (blocking step before payment).
2. Header + support note: `support@tigerteehclothing.com`.
3. Fields: **Person Name**, **Measurement For** (Male/Female), **Unit** (cm/in).
4. Info banner when cart needs **both** shirt + trouser (co-ord sets).
5. **Measurement progress** % (required fields filled).
6. Shirt block + guide image (fullscreen zoom).
7. Trouser block + guide image.
8. Optional notes.
9. **Save Measurements** → saved profile; next checkout: pick **default** or create another.

### 6.2 Field schema

**Shirt**

| Key | Label |
|-----|--------|
| `neck` | Neck |
| `shoulders` | Shoulders |
| `chest` | Chest |
| `sleeve_length` | Sleeve Length |
| `half_sleeve_length` | Half Sleeve Length |
| `bicep` | Bicep |
| `stomach_waist` | Stomach/Waist |
| `hip_shirt` | Hip |

**Trouser**

| Key | Label |
|-----|--------|
| `waist` | Waist |
| `hip` | Hip |
| `thigh_round` | Thigh Round |
| `full_rise` | Full Rise |
| `trouser_length` | Trouser Length |
| `bottom_hem` | Bottom Hem |

Store **canonical values in cm**; convert on read/write when unit = in.

Guide images: admin-uploadable assets under `measurement_guides` (men shirt, men trouser, women variants later).

### 6.3 Product → measurement requirements

On product (or category default):

- Co-ord / set → `requires_shirt_meas = true`, `requires_trouser_meas = true`
- Shirt-only → shirt only
- Trouser-only → trouser only

Admin product form: checkboxes “Requires shirt measurements / Requires trouser measurements.”

---

## 7. Admin dashboard (feature list)

### 7.1 Shell

- Login (admin role)
- Sidebar: Dashboard, Products, Categories, Banners, Tags, Deals, Orders, Customers / Measurements, Media, Settings
- Speedykart-like density: list + create/edit drawers or dedicated pages

### 7.2 Products (priority)

**List:** search, filter by tag/category/status, thumbnails, price range from variants.

**Create / Edit** (Speedykart-inspired, Tigerteeh-specific):

- Name, slug, description, details, categories
- Tags: bestseller, new arrival, popular, sale, custom
- Images (multi) → **server converts to WebP**
- Variants table: color name, hex/swatch, price, compare-at, SKU, active
- Measurement flags
- Status draft/active

**Live preview pane (required):**

| Tab | Frame |
|-----|--------|
| **Web view** | Desktop PDP / card mock (~1280× preview) |
| **Phone view** | Mobile PDP / card mock (~390× preview) |

Preview updates as the admin types/uploads **before Save** (client-side blob URLs + draft state). Same idea for banners.

### 7.3 Categories

- CRUD, image (WebP), sort order, active
- Powers homepage circles + shop filters
- “New Arrivals” can be a **virtual category** (tag/rule) or a real category — prefer **tag `new_arrival`** + optional nav entry

### 7.4 Banners

- Slot picker with **placement screenshot** (“this is where it appears on the site”)
- Upload desktop + mobile → WebP
- Copy fields matching current Hero/Promo (eyebrow, lead, accent, CTA, align, object-position)
- Sort order, schedule window
- **Unsaved live preview** in desktop + phone frames (inject draft image into mock homepage chrome)

### 7.5 Tags & deals

- Tags: popular, sale, bestseller, new_arrival, custom
- Deals: attach products, % or fixed off, **countdown** (`ends_at`), storefront shows timer on cards / promo section

### 7.6 Orders

- List/detail, status pipeline (pending → confirmed → in_production → shipped → delivered)
- Show **measurement snapshot** on each line / order (critical for custom-made)

### 7.7 Media

- Central library optional v2; v1: upload endpoints used by product/banner forms
- Always WebP output; keep original optionally for re-encode

---

## 8. Media pipeline

```text
Upload (jpg/png/webp)
  → validate mime + max size
  → convert to WebP (quality ~80–85)
  → store `/uploads/{entity}/{id}/{uuid}.webp`
  → return public URL
```

Admin and storefront both use returned URLs. Next.js `images.remotePatterns` / local rewrite as needed.

---

## 9. API surface (v1 sketch)

Base: `http://localhost:4000/api/v1`

### Public (storefront)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health |
| GET | `/categories` | Active categories |
| GET | `/products` | List (`tag`, `category`, `q`, page) |
| GET | `/products/:slug` | PDP |
| GET | `/banners?slot=hero` | Slot banners |
| GET | `/deals/active` | Active deals + countdown |
| POST | `/auth/register` `/auth/login` | Customer auth |
| GET/POST/PUT | `/me/measurement-profiles` | Saved measurements |
| POST | `/orders` | Place order (auth or guest + email) |

### Admin (JWT `role=admin`)

| Area | Paths |
|------|-------|
| Products | CRUD + images + variants |
| Categories | CRUD |
| Banners / slots | CRUD |
| Tags / deals | CRUD |
| Orders | list, status update |
| Uploads | `POST /admin/media` |

Response shape (simple):

```json
{ "data": {}, "error": null }
```

---

## 10. Storefront migration plan

1. Add `NEXT_PUBLIC_API_URL`.
2. Replace `src/data/products.ts` reads with fetch helpers / React Query (or server components).
3. Hero / Promo / CategoryCircles read banners & categories from API.
4. Cart keeps client state initially, but checkout:
   - Load/create measurement profiles
   - Block submit until complete
   - `POST /orders` with items + measurement snapshot
5. Delete or gate mock seed once admin has seeded real catalog.

---

## 11. Implementation phases

### Phase 0 — Foundations (this week)

- [ ] Replace Node Express scaffold with **Go** module layout
- [ ] Postgres + migrations (golang-migrate or goose)
- [ ] Auth (admin seed user)
- [ ] Media upload + WebP
- [ ] OpenAPI / README for local run

### Phase 1 — Catalog admin + public read

- [ ] Categories CRUD + public list
- [ ] Products + variants + images CRUD
- [ ] Tags + bestsellers / new arrivals queries
- [ ] Admin product form with **web + phone preview**
- [ ] Storefront homepage + shop + PDP on API

### Phase 2 — Banners & deals

- [ ] Banner slots + screenshots
- [ ] Banner CRUD + **unsaved live preview**
- [ ] Deals + countdown UI storefront + admin

### Phase 3 — Measurements & checkout

- [ ] Measurement profiles API
- [ ] Storefront measurement step (match screenshots + guides)
- [ ] Orders with frozen measurement snapshot
- [ ] Admin order detail shows measurements

### Phase 4 — Harden

- [ ] Real payments (optional)
- [ ] Emails (order + measurement confirmation)
- [ ] Deploy (Vercel storefront/admin + Supabase Postgres + container host for Go API — see `docs/DEPLOY.md`)

---

## 12. Admin product form UX (detail)

Inspired by Speedykart product admin density, adapted for fashion MTO:

```text
┌─────────────────────────────────────────────────────────────┐
│  New Product                         [Draft] [Save] [Publish]│
├──────────────────────────┬──────────────────────────────────┤
│  Form                    │  Preview                         │
│  - Title / slug          │  [ Web ] [ Phone ]               │
│  - Description           │  ┌────────────────────────────┐  │
│  - Categories / tags     │  │  Device frame              │  │
│  - Images dropzone       │  │  Product card / PDP mock   │  │
│  - Variants matrix       │  │  uses draft images/prices  │  │
│    color | hex | price   │  └────────────────────────────┘  │
│  - Meas. requirements    │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

Banner editor: same split — slot screenshot on left legend, live mock on right.

---

## 13. Seed & cutover

1. Seed admin: `admin@tigerteehclothing.com` (env password).
2. Import current WebP product images from `frontend/public/images/products`.
3. Recreate Signature Sets / New Arrivals as tagged products.
4. Recreate 3 hero slides + promo banner as banner rows.
5. Flip storefront to API; remove mock catalog.

---

## 14. Non-goals (v1)

- Multi-seller marketplace (Speedykart HotBox/SM)
- Delivery rider apps
- Full CMS for every text string
- Live WooCommerce sync (one-way import optional later)

---

## 15. Decisions to confirm before coding

| # | Question | Proposed default |
|---|----------|------------------|
| 1 | Backend language | **Go** |
| 2 | DB | **PostgreSQL** |
| 3 | Guest checkout? | Yes, with email + measurements |
| 4 | Size charts vs pure MTO | **MTO measurements required**; optional display size for filtering |
| 5 | Currency currency | INR primary + existing currency switcher later via FX |
| 6 | Where do placement screenshots live? | Seeded in `banner_slots` (admin can replace) |

---

## 16. Next step

After you approve this plan (especially §15):

1. Implement **Phase 0** in `backend/` (Go + Postgres + WebP + auth).
2. Flesh **admin** login + products with dual preview.
3. Wire **frontend** read path, then measurements checkout.

Reply with any changes to §15 and we start Phase 0.
