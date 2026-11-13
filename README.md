# Tigerteeh Clothing

Monorepo: storefront, seller admin, and Go API.

```text
tigerteehcloothing/
├── frontend/     ← storefront (Next.js) → deploy on Vercel
├── admin/        ← seller admin (Next.js) → deploy on Vercel
├── backend/      ← Go API + Postgres → Railway/Render + Supabase
└── docs/DEPLOY.md
```

## Deploy (Vercel + Supabase)

See **[`docs/DEPLOY.md`](docs/DEPLOY.md)**.

- **Storefront + Admin** → Vercel (two projects, root dirs `frontend` / `admin`)
- **Postgres** → Supabase (`DATABASE_URL`)
- **Go API** → Railway / Render / Fly (Docker). Not Vercel serverless — needs uploads + a long-lived process.

Demo seed: `backend/seed/demo_seed.sql` via `npm run seed` or Supabase SQL editor.

Admin login (default): `admin@tigerteehclothing.com` / `TigerteehAdmin1!`

## Local development

Optional local launcher (gitignored): `./start.sh` — opens API + storefront + admin (and share mode).

```bash
npm run install:all

# API — set DATABASE_URL in backend/.env (local Postgres or Supabase)
npm run dev:backend    # :4000

# Apps
npm run dev:frontend   # :3000
npm run dev:admin      # :3001

# Optional catalog seed (after API has migrated once)
npm run seed
```

## Architecture plan

→ [`docs/BACKEND_AND_ADMIN_PLAN.md`](docs/BACKEND_AND_ADMIN_PLAN.md)
