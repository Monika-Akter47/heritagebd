# HeritageBD

A digital heritage-tourism and marketplace platform for Bangladesh: heritage places, verified tour guides and
bookings, a local-products marketplace, the **"Ready When You Arrive"** pre-order/pickup feature, trip planner,
reviews, chat, notifications and an admin panel.

**Stack:** React 19 + Vite 8 + TypeScript + Tailwind 4 (frontend) · PHP 8 REST API (PDO, no framework) ·
PostgreSQL on **Supabase** in production, MySQL / MariaDB (XAMPP) for local development.

**Hosting:** frontend on **Vercel**, PHP API on **Render** (Docker), database on **Supabase**. Step by step:
[docs/deploy-vercel.md](docs/deploy-vercel.md). Full documentation lives in [`docs/`](docs/README.md),
including the [changelog](docs/CHANGELOG.md).

## Links

### Live deployment

| Link | What it is |
|---|---|
| [heritagebd-flax.vercel.app](https://heritagebd-flax.vercel.app) | The live website (React frontend on Vercel). Requests to `/api/*` are proxied to the Render API, so the browser only talks to this one domain. |
| [heritagebd-api.onrender.com/api/health](https://heritagebd-api.onrender.com/api/health) | API health check. Answers without touching the database. The free Render plan sleeps when idle, so the first request can take about 50 seconds. |
| [heritagebd-api.onrender.com/api/places](https://heritagebd-api.onrender.com/api/places) | Example public endpoint (heritage places). Returns JSON from the Supabase database. |

### Source and dashboards

| Link | What it is |
|---|---|
| [github.com/Monika-Akter47/heritagebd](https://github.com/Monika-Akter47/heritagebd) | This repository. Pushes to `main` redeploy the frontend on Vercel. |
| [Vercel project](https://vercel.com/monk25/heritagebd) | Frontend hosting: deployments, build logs and domain settings (team `monk25`; sign-in required). |
| [Render dashboard](https://dashboard.render.com) | Hosts the PHP API service `heritagebd-api` (Docker). Environment variables `DATABASE_URL`, `DB_PASS`, `CORS_ORIGIN` and `APP_TIMEZONE` live here. |
| [Supabase project](https://supabase.com/dashboard/project/sbhnmsrbvampinpgggvl) | PostgreSQL database `heritage-site` (region ap-southeast-1). Sign-in required. |

### Documentation

| Link | What it covers |
|---|---|
| [docs/README.md](docs/README.md) | Documentation index. |
| [docs/setup.md](docs/setup.md) | Local development setup (XAMPP, PHP API, frontend). |
| [docs/deploy-vercel.md](docs/deploy-vercel.md) | Deploying with Supabase, Render and Vercel, in that order. |
| [docs/deploy-bn.md](docs/deploy-bn.md) | The same deployment guide in Bengali. |
| [docs/architecture.md](docs/architecture.md) | How the frontend, API and database fit together. |
| [docs/frontend.md](docs/frontend.md) | Frontend structure, routing and state. |
| [docs/api.md](docs/api.md) | REST API reference. |
| [docs/database.md](docs/database.md) | Schema, migrations and the MySQL to PostgreSQL conversion. |
| [docs/workflows.md](docs/workflows.md) | Orders, pre-orders, guide bookings and settlements, step by step. |
| [docs/security.md](docs/security.md) | Authentication, rate limiting, uploads and data protection. |
| [docs/diagrams.md](docs/diagrams.md) | Architecture and flow diagrams. |
| [docs/contributing.md](docs/contributing.md) | Conventions, including writing SQL that runs on both databases. |
| [docs/known-issues.md](docs/known-issues.md) | Open issues and gaps. |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | History of changes. |

---

## 1. Requirements (Windows + VS Code + XAMPP)

| Tool | Version | Notes |
|---|---|---|
| XAMPP | PHP 8.0+ and MariaDB 10.4+ | Start **Apache** and **MySQL** in the XAMPP Control Panel |
| Node.js | 18 or newer | https://nodejs.org |
| VS Code | any | optional but recommended |

PHP extensions needed: `pdo_mysql` and `mbstring` (both are enabled by default in XAMPP).

## 2. Database setup

1. Start **MySQL** in XAMPP, then open http://localhost/phpmyadmin.
2. Create a database named `heritagebd` (collation `utf8mb4_general_ci`).
3. Select it → **Import** → choose `backend/database/schema.sql` → Go.
4. **Import** `backend/database/seed.sql` (demo data).

Or from a terminal (XAMPP's `mysql.exe` is in `C:\xampp\mysql\bin`):

```bat
cd C:\path\to\heritage
C:\xampp\mysql\bin\mysql -u root -e "CREATE DATABASE heritagebd CHARACTER SET utf8mb4;"
C:\xampp\mysql\bin\mysql -u root heritagebd < backend\database\schema.sql
C:\xampp\mysql\bin\mysql -u root heritagebd < backend\database\seed.sql
```

> `schema.sql` drops and recreates every table, so re-importing it resets the database.

## 3. Backend setup (PHP API)

The API reads its settings from environment variables, with XAMPP-friendly defaults
(`backend/config/database.php`): `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME=heritagebd`,
`DB_USER=root`, `DB_PASS=` (empty), `CORS_ORIGIN=*`, `APP_TIMEZONE=Asia/Dhaka`.

> **Upgrading an existing database?** Run `backend/database/migrations/005_auth_hardening.sql` once
> before starting the new API, or login will fail. See [docs/CHANGELOG.md](docs/CHANGELOG.md).
Uploaded images and private documents are stored in the ignored
`heritagebd-data/uploads/` directory at the project root by default, outside
the API's public web root. You can set `HERITAGE_UPLOAD_DIR` to a writable
persistent directory when needed.

Easiest way to run it - PHP's built-in server (XAMPP's PHP is at `C:\xampp\php\php.exe`):

```bat
cd backend
C:\xampp\php\php.exe -S localhost:8080 index.php
```

Leave that window open. Test it: open http://localhost:8080/api/places - you should see JSON.

If your MySQL root user has a password:

```bat
set DB_PASS=yourpassword
C:\xampp\php\php.exe -S localhost:8080 index.php
```

(Alternative: copy `backend` into `C:\xampp\htdocs\heritagebd-api` and use Apache; `.htaccess` already routes everything to
`index.php`. Then set `VITE_API_URL=http://localhost/heritagebd-api`.)

## 4. Frontend setup

```bat
copy .env.example .env
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:8443 unless the `PORT` environment variable is set). For a
production build: `npm run build`; to type-check: `npm run typecheck`.

`.env` contains only `VITE_API_URL` (the API address). **No database credentials ever go in the frontend.**
Uploaded image paths are stored in MySQL relative to the API, so they continue
working when the scaffold is copied or deployed at a different host. For an
existing database, run `backend/database/migrations/004_portable_image_paths.sql`.

## 5. Demo accounts

All seeded accounts use the password **`password123`**.

| Role | Email |
|---|---|
| Tourist | tourist@heritagebd.com |
| Vendor | rahima@muslinhouse.com (also fatema@example.com) |
| Guide | arif@guide.com |
| Admin | admin@heritagebd.com |

## 6. User roles

| Role | Can do |
|---|---|
| **Tourist** | Explore/search places, find & book guides, shop, checkout, pre-order for pickup, plan trips, chat, review |
| **Vendor** | Manage own products/stock, process own orders, run the pre-order workflow (accept → prepare → ready → verify QR → collect 70% → complete) |
| **Guide** | Edit profile, toggle availability / location sharing, accept/decline bookings, mark tours finished (the tourist then confirms completion) |
| **Admin** | Platform stats, verify guides/vendors, suspend users, manage products, orders, bookings, reviews, events, stories, pre-order settings |

Roles are enforced **on the server** for every request (the role in the browser is never trusted).

## 7. Major features and how they work

* **Auth** - bcrypt password hashing, bearer tokens stored only as SHA-256 hashes in `auth_tokens`, rate-limited
  login / password-reset (HTTP 429), suspended users blocked and logged out, change-password signs out other devices.
* **Guide booking** - the server rejects overlapping dates for the same guide (pending/accepted). The guide
  accepts/rejects and marks the tour finished after its last day; the tourist confirms completion, which releases the
  20% advance (10% platform, 10% guide). Tourists may cancel pending/accepted bookings.
* **Guide location** - a guide's position is only returned when they are *verified*, *available* **and** have switched on
  location sharing; even then it is rounded to ~1 km. Email/phone are visible only to the guide and admins.
  **This is not live GPS tracking** - it shows the base area saved in the guide's profile.
* **Marketplace** - the server rebuilds the cart total from database prices (client totals are ignored), validates the shipping
  address, and decrements stock atomically so two buyers cannot oversell the last item. Vendors can only touch their own products/orders.
* **Ready When You Arrive** - tourist pays a **30% advance**, the remaining **70%** is collected at pickup.
  Status flow enforced by the server:
  `advance_paid → vendor_accepted → preparing → ready_for_pickup → arrived → qr_verified → pickup_payment_pending → picked_up → completed`
  (cancellation allowed before pickup; `refunded` is admin-only). Each step is limited to the correct role, QR verification
  requires the correct code, and `picked_up` requires the remaining-payment method.
  **Payments are simulated** - there is no bKash/Nagad/card gateway; the amounts and status are recorded but no money moves.
* **QR** - the tourist's pickup code is shown on screen; there is no camera scanner, the vendor types/pastes the code.
* **Reviews** - 1-5 stars, one review per user per item, can't review your own listing, averages recalculated, owner notified.
* **Chat & notifications** - plain HTTP polling (chat every 5 s while open, notifications every 20 s). It is **not** WebSocket real-time.
* **Local foods & products by area** - pick a destination, place or area (Chattogram, Sylhet, Dhaka…) and see its
  traditional foods (32 included, editable in Admin → Traditional Foods) and local products, the area's own items
  first, then the rest of its division. Shown in the trip planner, on place pages, and in the shop (`/shop?area=`).
* **Trip planner** - saved trips, days and stops persist in MySQL (add/remove stops, add days, delete trip). The "generate itinerary"
  wizard uses built-in sample routes (static data), then saves the result.

## 8. API overview (`/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `POST /auth/logout` `GET/PUT /auth/me` `PUT /auth/password` `POST /auth/forgot-password` `POST /auth/reset-password` |
| Places | `GET /places` `GET /places/:id` `GET /places/:id/reviews` `POST /places/:id/save` `POST/PUT/DELETE /places` (admin) |
| Guides | `GET /guides` `GET /guides/:id` `PUT /guides/:id` |
| Bookings | `GET/POST /bookings` `PUT /bookings/:id` |
| Products | `GET /products` `GET /products/:id` `POST/PUT/DELETE /products` (vendor/admin) |
| Cart & orders | `GET/POST/PUT/DELETE /cart` `GET/POST /orders` `PUT /orders/:id` |
| Pre-orders | `GET/POST /preorders` `GET/PUT /preorders/:id` `GET/PUT /preorders/settings` |
| Reviews | `GET/POST /reviews` |
| Trips | `GET/POST /trips` `GET/PUT/DELETE /trips/:id` |
| Chat | `GET/POST /conversations` `GET/POST /conversations/:id/messages` |
| Notifications | `GET /notifications` `PUT /notifications/:id/read` `PUT /notifications/read-all` |
| Events / Stories | `GET /events` `GET /stories` (read) |
| Areas & foods | `GET /areas` `GET /areas/resolve` `GET /local-foods?area=` · `GET /products?area=` · admin `POST/PUT/DELETE /admin/local-foods` |
| Admin | `GET /admin/stats` `GET /admin/users` `PUT /admin/users/:id/status` `GET /admin/guides/pending` `PUT /admin/guides/:id/verify` `GET /admin/vendors` `GET /admin/vendors/pending` `PUT /admin/vendors/:id/verify` `GET /admin/reviews` `DELETE /admin/reviews/:id` `POST/DELETE /admin/events` `POST/DELETE /admin/stories` |

Responses are `{ "success": true, "data": … }` or `{ "success": false, "message": "…" }`. Server errors are logged to the PHP
error log and a generic message is returned (no SQL/PHP details are exposed).

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Pages are empty / "Failed to fetch" | The API isn't running. Start `php -S localhost:8080 index.php` inside `backend`, and check `VITE_API_URL` in `.env` (restart `npm run dev` after editing). |
| `Database connection failed` | MySQL isn't started in XAMPP, the `heritagebd` database doesn't exist, or the password is wrong (set `DB_PASS`). |
| `Call to undefined function mb_substr()` | Enable `extension=mbstring` in `C:\xampp\php\php.ini` and restart. |
| Login says invalid credentials for demo users | You haven't imported `seed.sql`. |
| Login returns "Something went wrong" after upgrading | Run `backend/database/migrations/005_auth_hardening.sql`. |
| "Too many attempts" (429) | Wait 15 minutes, or in development `DELETE FROM auth_attempts;`. |
| Port 8080 busy | Use another port, e.g. `-S localhost:8081`, and update `VITE_API_URL`. |
| Apache gives 404 for `/api/...` | `mod_rewrite` must be on and `AllowOverride All` for the folder (the PHP built-in server avoids this). |
| Changes to `.env` ignored | Stop and re-run `npm run dev`. |
