# Deploying: Vercel + Render + Supabase

| Part | Service | What runs there | Config in this repo |
|---|---|---|---|
| Frontend | **Vercel** | The React build (`dist/`) | [`vercel.json`](../vercel.json) |
| Backend | **Render** | The PHP API as a Docker container | [`render.yaml`](../render.yaml), [`backend/Dockerfile`](../backend/Dockerfile) |
| Database | **Supabase** | PostgreSQL 17 | [`backend/database/postgres/`](../backend/database/postgres/) |

```mermaid
flowchart LR
    U[Visitor] --> V["Vercel<br/>heritagebd-flax.vercel.app"]
    V -- "/api/* rewrite (same origin)" --> R["Render · Singapore<br/>heritagebd-api.onrender.com<br/>PHP 8.2 + Apache"]
    R -- "Session pooler · TLS · IPv4" --> S[("Supabase · ap-southeast-1<br/>PostgreSQL 17, RLS on")]
    R --- IMG[("/var/heritagebd-uploads<br/>images baked into the image")]
```

The backend speaks both MySQL (local XAMPP) and PostgreSQL (Supabase); `DATABASE_URL` decides which.
Everything below was tested end to end against PostgreSQL: `php backend/tests/api_smoke.php` passes
121/121 checks on both databases.

Order: **Supabase → Render → Vercel**, because each step needs the address of the one before.

---

## 1. Supabase (database)

The project **`heritagebd`** (ref `sbhnmsrbvampinpgggvl`, region Singapore) already exists and is
loaded: schema from `backend/database/postgres/schema.sql`, and a copy of the local XAMPP data
(50 tables, 727 rows, row counts verified). Row Level Security is enabled on every table with no
policies, so Supabase's public Data API can read nothing; only the PHP API (connecting as `postgres`)
can. The Supabase linter's "RLS enabled, no policy" notices are expected.

What you still need to do:

1. Supabase dashboard → project **heritagebd** → **Project Settings → Database → Reset database
   password**. Choose a strong password and keep it for step 2.
2. Click **Connect** (top bar) → **Session pooler** and copy the URI. It looks like
   ```
   postgresql://postgres.sbhnmsrbvampinpgggvl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   Use the **Session pooler**, not "Direct connection" (IPv6 only, and Render has no IPv6) and not
   "Transaction pooler" (port 6543, which breaks PHP's prepared statements). If the password contains
   characters such as `@`, `:` or `/`, URL-encode them (`@` → `%40`).

### Starting a fresh Supabase project instead

In the SQL editor, run `backend/database/postgres/schema.sql`, then either
`backend/database/postgres/seed.sql` (demo data) or your own converted data:

```bash
C:\xampp\mysql\bin\mysqldump -u root --default-character-set=utf8mb4 --no-create-info --complete-insert --skip-triggers heritagebd --ignore-table=heritagebd.auth_tokens --ignore-table=heritagebd.auth_attempts --ignore-table=heritagebd.password_resets --result-file=data.mysql.sql
```
```bash
php scripts/mysql-to-postgres.php data data.mysql.sql > data.pg.sql
```

Run `data.pg.sql` after deleting the default rows the schema inserts
(`DELETE FROM commission_settings; DELETE FROM local_foods;`), since the dump contains them too.

## 2. Render (PHP API)

1. Render → **New → Blueprint** → connect `Monika-Akter47/heritagebd`. Render reads
   [`render.yaml`](../render.yaml): Docker, `backend/Dockerfile`, build context = repo root, region
   Singapore, free plan, health check `/api/health` (needs no database, so a wrong `DATABASE_URL` shows as a JSON error instead of a service that never comes online).
   (Manual alternative: **New → Web Service → Docker**, Dockerfile Path `backend/Dockerfile`, Docker
   Build Context Directory **`.`**, not `backend`.)
2. When asked for environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | The Session pooler URI from step 1 **without the password**, e.g. `postgresql://postgres.sbhnmsrbvampinpgggvl@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` |
   | `DB_PASS` | Your Supabase database password exactly as typed. Keeping it separate means characters such as `@ # / :` need no URL-encoding |
   | `CORS_ORIGIN` | Your Vercel URL (e.g. `https://heritagebd-flax.vercel.app`). Harmless with the rewrite; required if you call Render directly |
   | `APP_TIMEZONE` | `Asia/Dhaka` (preset) |

   TLS is on by default for PostgreSQL (`sslmode=require`). To also verify the server certificate,
   download it from Supabase (Project Settings → Database → SSL) and paste its text into
   `DB_SSL_CA_PEM`; the API then uses `verify-full`.
3. Deploy, then check:
   - `https://heritagebd-api.onrender.com/api/places` returns JSON with 12 places.
   - `https://heritagebd-api.onrender.com/api/product-images/835d69733226b8c1632d5527003e3f35` shows Lalbagh Fort.
   - `https://heritagebd-api.onrender.com/api/local-foods?area=Sylhet` returns 4 foods.

   If Render gave the service a different name, use that URL here and in step 3.

**Uploads on Render's free plan.** The product and profile images committed to git are copied into
the image and always available. Files uploaded through the site after deploy (new photos, verification
documents) go to the container disk, which the **free plan wipes on every restart and redeploy**. For
real use, add a paid **persistent disk** mounted at `/var/heritagebd-uploads`, then copy
`heritagebd-data/uploads/products`, `/profiles` and `/private` onto it once (the empty disk hides the
baked-in images). Until then, the 5 verification documents recorded in the database exist only on
your computer in `heritagebd-data/uploads/private`, so admin downloads of them return 404 on Render.

The free plan also sleeps after about 15 minutes idle; the first request afterwards takes 30–60 s.

## 3. Vercel (frontend)

1. Vercel → **Add New → Project** → import `Monika-Akter47/heritagebd`. Root directory: repo root.
   Framework, build command and output come from [`vercel.json`](../vercel.json).
2. **Don't set `VITE_API_URL`.** `vercel.json` forwards `/api/*` to
   `https://heritagebd-api.onrender.com`, and production builds call the site's own origin, so the
   browser never talks to Render directly: no CORS, preview deployments work, images load through
   the same rewrite.
   If your Render URL differs, change the `destination` in `vercel.json` and push.
3. Deploy. Deep links such as `/places/p1` work through the SPA fallback rule.

(Alternative: set `VITE_API_URL=https://heritagebd-api.onrender.com` in Vercel's environment
variables, remove the `/api` rewrite, and set `CORS_ORIGIN` on Render to your exact Vercel URL.
Preview URLs will then be blocked by CORS.)

## 4. After the first deploy

- [ ] **Change the demo passwords.** These accounts came over from the local database with the public
      password `password123`. Sign in as each one you keep and use **Account Settings → Change
      password**, or suspend the ones you don't need from **Admin → Users**:
      `admin@heritagebd.com` (**admin, do this first**), `tourist@heritagebd.com`, `monika@heritagebd.com`,
      `arif@guide.com` and the other `@guide.com` guides, `rahima@muslinhouse.com`, `fatema@example.com`,
      `rina@example.com`, `karim@example.com`, `spice@example.com`, `muslin@example.com`,
      `sundarbans@example.com`, `ctg@example.com` (if present), the `…@rajshahicraft.com`,
      `…@nokshikatha.com`, `…@sylhetitea.com` vendors, and the reviewer accounts
      `sarah/tanvir/emily/rafiq.reviewer@example.com`, `nusrat@example.com`.
- [ ] Run the smoke test against the live API **only if you're happy for it to create test data**
      (an order, booking, pre-order, trip, message):
      `php backend/tests/api_smoke.php https://heritagebd-api.onrender.com`.
      It signs in with the demo passwords, so run it before changing them, or not at all.
- [ ] Open the site: images load (DevTools → Network shows 200s), `/shop?area=Sylhet` shows foods,
      checkout shows the 20% advance, Admin → Earnings loads.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Database connection failed` (Render logs show the reason) | Wrong password in `DATABASE_URL`; Direct-connection URI used instead of Session pooler; special characters in the password not URL-encoded |
| `prepared statement "pdo_stmt_…" does not exist` | Transaction pooler (port 6543) used. Switch to the Session pooler (5432) |
| Login returns 500 | Schema incomplete on the database. Run `postgres/schema.sql` |
| Images 404 but the API works | Render built with context `backend` instead of `.`; or a persistent disk is mounted without the images copied onto it |
| `/api/...` returns the website's HTML | The `/api` rewrite must come **before** the SPA rule in `vercel.json` |
| CORS error in the browser console | Calling Render directly without `CORS_ORIGIN`; use the rewrite instead |
| First request very slow | Render free plan waking from sleep |
| "File missing on server" for an old upload | Free-plan disk is wiped on deploy. Uploads since 2026-10-27 are kept in `stored_files`; older ones must be re-uploaded or restored with `backend/tools/restore_documents.php` |
| Password-reset email never arrives | The container has no mail transport for PHP `mail()`; configure SMTP first |

## Keeping MySQL and PostgreSQL in step

`backend/database/schema.sql` and `seed.sql` (MySQL) are the source of truth. After changing them,
regenerate the PostgreSQL versions with `npm run db:pg` (runs `scripts/mysql-to-postgres.php`). For an
existing Supabase database, write the change as SQL and apply it in the Supabase SQL editor. Write new
queries in SQL both databases accept (see [contributing.md](contributing.md#writing-sql-for-both-databases)).
