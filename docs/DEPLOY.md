# Deploy Tigerteeh (Vercel + Supabase)

## Pieces

| App | Host | Notes |
|---|---|---|
| Storefront `frontend/` | **Vercel** | Next.js |
| Admin `admin/` | **Vercel** (2nd project) | Next.js |
| API `backend/` | **Railway / Render / Fly** (Docker) | Go + uploads — not a good fit for Vercel serverless |
| Database | **Supabase** Postgres | Same `DATABASE_URL` the API already uses |

Vercel is perfect for the two Next apps. The Go API needs a normal container host (file uploads, long-lived process). Point it at Supabase Postgres.

## 1. Supabase Postgres

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string** (URI). Prefer the **pooler** URI for serverless clients; for the Go API a direct URI is fine.
3. Example:

```text
postgres://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Append `?sslmode=require` if missing.

## 2. API (Railway example)

1. New Railway project → Deploy from GitHub → root directory `backend`.
2. Dockerfile is already at `backend/Dockerfile`.
3. Set env:

```text
DATABASE_URL=postgres://...supabase.../postgres?sslmode=require
JWT_SECRET=<long random string>
PUBLIC_BASE_URL=https://your-api.up.railway.app
STOREFRONT_ORIGIN=https://your-store.vercel.app
ADMIN_ORIGIN=https://your-admin.vercel.app
ADMIN_EMAIL=admin@tigerteehclothing.com
ADMIN_PASSWORD=<strong password>
UPLOAD_DIR=uploads
ADDR=:8080
```

4. First boot runs migrations + creates the admin user.
5. Seed demo catalog:

```bash
cd backend
DATABASE_URL='postgres://...supabase...' go run ./cmd/seed
```

Or paste / run `backend/seed/demo_seed.sql` in the Supabase SQL editor **after** the API has migrated once.

## 3. Storefront on Vercel

1. Import the repo → **Root Directory: `frontend`**.
2. Env:

```text
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
```

3. Deploy. Product images in the seed use `/images/products/...` from `frontend/public`.

## 4. Admin on Vercel

1. Second Vercel project → **Root Directory: `admin`**.
2. Env:

```text
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
```

3. Login with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the API.

## Local (no start.sh)

```bash
# Terminal 1 — API (needs local or Supabase DATABASE_URL in backend/.env)
cd backend && go run ./cmd/api

# Terminal 2 — storefront
cd frontend && npm run dev

# Terminal 3 — admin
cd admin && npm run dev

# Optional demo data
cd backend && go run ./cmd/seed
```

Root scripts:

```bash
npm run install:all
npm run seed
```
