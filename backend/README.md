# Tigerteeh Backend (Go)

REST API for the storefront and seller admin panel.

## Prerequisites

- Go 1.22+
- PostgreSQL 16 (`tigerteeh` database)
- `cwebp` on PATH (WebP conversion)

## Setup

```bash
# create DB (once)
psql "postgresql://ghost@127.0.0.1:5432/postgres" -c "CREATE ROLE tigerteeh LOGIN PASSWORD 'tigerteeh';" || true
psql "postgresql://ghost@127.0.0.1:5432/postgres" -c "CREATE DATABASE tigerteeh OWNER tigerteeh;" || true

cp .env.example .env
go mod tidy
go run ./cmd/api
```

API: [http://localhost:4000/health](http://localhost:4000/health)

Default admin:

- Email: `admin@tigerteehclothing.com`
- Password: `TigerteehAdmin1!`

## Useful routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| POST | `/api/v1/auth/login` | — |
| GET | `/api/v1/products` | — |
| GET | `/api/v1/banners?slot=hero` | — |
| * | `/api/v1/admin/*` | Bearer admin JWT |
| POST | `/api/v1/admin/media` | multipart `file` → WebP URL |

Uploads are served from `/uploads/*`.
