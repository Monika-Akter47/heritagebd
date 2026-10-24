# Setup and deployment

For a step-by-step Windows/XAMPP walkthrough see the top-level [README](../README.md). This page is
the condensed, platform-neutral version.

## Prerequisites

- Node.js 18+ (the Figma Make toolchain pins versions in `.mise.toml`)
- PHP 8.0+ with `pdo_mysql` and `mbstring`
- MySQL 8+ or MariaDB 10.4+

## 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE heritagebd CHARACTER SET utf8mb4;"
mysql -u root -p heritagebd < backend/database/schema.sql
mysql -u root -p heritagebd < backend/database/seed.sql   # demo data, dev only
```

`schema.sql` drops and recreates every table. For an **existing** database, apply the files in
`backend/database/migrations/` instead (list and order in [database.md](database.md#migrations)).

Seeded accounts all use `password123`: `tourist@heritagebd.com`, `rahima@muslinhouse.com` (vendor),
`arif@guide.com` (guide), `admin@heritagebd.com` (admin).

## 2. API

```bash
cd backend
php -S localhost:8080 index.php
```

Check it with `curl http://localhost:8080/api/places`.

### Backend environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `heritagebd` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASS` | *(empty)* | Database password |
| `CORS_ORIGIN` | `*` | Allowed browser origin; set to the real frontend URL in production |
| `HERITAGE_UPLOAD_DIR` | `<project>/heritagebd-data/uploads` | Writable directory for images and private documents |
| `APP_TIMEZONE` | `Asia/Dhaka` | Timezone for both PHP and the MySQL session. They must agree for date checks and token expiry |

Password-reset codes are sent with PHP `mail()`; configure a mail transport on the host.

## 3. Frontend

```bash
cp .env.example .env      # sets VITE_API_URL
npm install
npm run dev               # vite --host 0.0.0.0, port $PORT or 8443
```

| Script | Action |
|---|---|
| `npm run dev` | Vite dev server (port from `$PORT`, default 8443, `strictPort`) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` (strict mode; currently passes with zero errors) |
| `npm run format` | oxfmt |

Only `VITE_API_URL` belongs in `.env`; anything prefixed `VITE_` is shipped to the browser.

## 4. Tests

```bash
php backend/tests/settlement_smoke.php
```

This is the only automated test: it checks the advance/commission split arithmetic. There is no
frontend test suite; run `npm run typecheck` and `npm run build`. See [contributing.md](contributing.md)
for the full pre-merge checklist.

## 5. Deployment

**API**

- Apache/cPanel: upload `backend/` as-is; `.htaccess` routes to `index.php` (needs `mod_rewrite`
  and `AllowOverride All`).
- Nginx: `try_files $uri $uri/ /backend/index.php?$query_string;`
- Serve over HTTPS, set `CORS_ORIGIN`, set real DB credentials, and point `HERITAGE_UPLOAD_DIR` at a
  persistent directory that is **not** web-accessible. Back it up with the database.
- Do not load `seed.sql` in production (it contains known-password accounts).

**Images: what makes them work on any host**

- The database stores uploaded images as relative paths (`/api/product-images/<id>`,
  `/api/profile-images/<id>`); the frontend adds the API address when displaying them. Never store
  `http://localhost...` URLs; if an old database has them, run `004_portable_image_paths.sql`.
- The image files live in `heritagebd-data/uploads/products` and `.../profiles` **inside the project
  and are committed to git**, so they deploy with the code. `.../private` (NID and licence documents)
  is git-ignored: copy it to the server separately and never make it web-accessible.
- On the server the API serves those files itself, so `heritagebd-data/` must sit next to `backend/`
  (or set `HERITAGE_UPLOAD_DIR`) and be writable for new uploads.
- The database and seed contain **no external image links**: demo photos that used to come from
  Unsplash are local copies in `uploads/products` (migration `007_local_demo_images.sql`). Photos
  Unsplash had deleted show a HeritageBD "Photo coming soon" placeholder
  (`/api/product-images/a2998d77660b2504af2ab639b4268df4`); replace them from the admin pages.
- Hard-coded images in the frontend source (`src/`, for example trip planner destinations and the
  landing page) are still Unsplash links.

**Frontend**

- API address: set `VITE_API_URL` at build time when the API is on another host
  (`VITE_API_URL=https://api.example.com npm run build`). If it is not set, a production build uses
  the site's own origin, which suits hosting the frontend and `backend/` on one domain with `/api/*`
  routed to `backend/index.php`. Development builds still default to `http://localhost:8080`.
- The page title and description come from `.figma/make/site.json`.

- `npm run build` and host `dist/` on any static host. Configure SPA fallback (all unknown paths →
  `index.html`) because the app uses `BrowserRouter`.
- Set `VITE_API_URL` at build time.

**Before going live**, work through the checklist in [security.md](security.md#production-checklist)
and replace the payment stub (see [workflows.md](workflows.md#payments)).
