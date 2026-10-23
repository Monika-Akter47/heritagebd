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

**Frontend**

- `npm run build` and host `dist/` on any static host. Configure SPA fallback (all unknown paths →
  `index.html`) because the app uses `BrowserRouter`.
- Set `VITE_API_URL` at build time.

**Before going live**, work through the checklist in [security.md](security.md#production-checklist)
and replace the payment stub (see [workflows.md](workflows.md#payments)).
