# Changelog

All notable changes to HeritageBD. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); dates are YYYY-MM-DD.

## 2026-10-27: Durable uploads, pickup codes, verification alerts

### Fixed

- **Uploaded files vanished after every deploy** ("file missing on server" in the Verification Center).
  Render's disk is wiped on deploy, so uploads (documents, product and profile photos) are now also stored
  in the new `stored_files` table and served from there when the disk copy is gone. Files lost before this
  fix must be uploaded again; `backend/tools/restore_documents.php` copies any that still exist locally.
- Vendors could not verify a pickup: they had to type the full QR text exactly. Tourists now see an
  8-character **pickup code** under the QR; vendors enter the order number and that code (case and spaces
  ignored), also from `ready_for_pickup`.
- Admins got no notification when a guide or vendor submitted for verification; they now do, with a link
  to the Verification Center.
- The Verification Center showed "0 files" and "no documents"; it now lists the uploaded documents with
  View buttons, plus NID, licence number and certifications.

### Added

- Tests TC-127 (pickup code), TC-128 (admin notified), TC-129 (documents survive a wiped disk).

## 2026-10-26: Test suite and fixes from testing

### Added

- Automated test suite (`npm test`, `npm run test:e2e`, `npm run test:coverage`): PHPUnit unit and API
  integration tests against an in-memory PostgreSQL, Vitest frontend tests, Playwright journeys, a p95
  script, and evidence under `docs/testing/evidence/`. See README §9 and the Software Test Report.

### Fixed (found by the tests)

- **Security:** a tourist could set any `refundAmount` when cancelling a pre-order. Refunds are now
  computed by the server; only an admin may set one by hand.
- Pre-order cancellation (FR-34): a tourist can cancel only before preparation starts, and the refund is
  the configured percentage of the advance (vendor/admin cancellation refunds it in full).
- Pre-order settings accepted out-of-range values (e.g. a 101% refund); they are now validated.
- A rejected vendor stayed active; rejection now suspends the account, as for guides (FR-04).
- PHP warnings (e.g. a failed reset e-mail) were printed into API responses where `display_errors` is on,
  breaking the JSON, exposing paths and revealing registered e-mails. The API now always logs them.
- `backend/tests/api_smoke.php` sends the bKash payer number and TrxID now required for pre-orders.

## 2026-10-26: Payment records, guide cash, Bengali text

### Added

- **Payment proof for bKash/Nagad.** Until a gateway is connected, wallet payments are made with
  "Send Money"; the payer's number and TrxID are now collected and stored (migration
  `009_payment_details.sql`): pre-order advance (required), marketplace order and guide booking advance
  (collected by the checkout forms, optional in the API so trip-planner bookings still work), and the
  remaining pre-order payment at pickup. Shared form: `src/components/ui/PaymentProofFields.tsx`;
  server validation: `payment_proof()` in `backend/helpers/payments.php`.
- **Admin › Payments & Advances** (`GET /api/admin/payments`): every online advance (held / released /
  refunded) and every balance paid to a partner (pre-order pickup, guide cash) with method, payer number
  and TrxID, totals, search and filters. Flags wallet payments without proof.
- **Pre-order receipt:** the tourist can confirm "I received my order" once it is handed over, which
  completes the pre-order and settles the advance (the vendor can still complete it too).
- **Guide balance payments in the UI.** The guide can mark the balance received (cash, bKash, Nagad)
  or confirm what the tourist reported; the tourist can mark it paid from their profile. The guide
  dashboard shows **Cash Received** and **Cash to Collect** (`cashConfirmed` / `cashAwaiting` in
  `GET /api/earnings/me`) instead of counting all cash as collected.
- Noto Sans Bengali / Noto Serif Bengali as fallback fonts (`--font-sans`, `--font-display`), so Bengali
  names and ৳ render the same on every device.

### Fixed

- **Garbled Bengali text** ("αª¼αªù…") in place names, local foods, products, stories and events: the
  XAMPP dump had been written through the Windows console (code page 437). 79 values were decoded back to
  UTF-8 on Supabase. Dump with `--result-file` (see `docs/deploy-vercel.md`), not `>` in PowerShell.
- Reporting a guide payment failed on PostgreSQL (`"reported"` was a double-quoted literal).
- Guide payments recorded the full tour price; they now record the booking balance (total − advance),
  which is what the guide actually collects.
- The vendor's pickup-payment step used `window.prompt`; it is now an inline form.
- Admin › Ready to Pick Orders: the status filter did nothing; it filters now and shows payment details.

## 2026-10-25: Supabase (PostgreSQL), Render, Vercel

### Added

- **PostgreSQL support** alongside MySQL. `config/database.php` reads `DATABASE_URL` (or `DB_DRIVER`)
  and connects to Supabase over TLS; `HeritagePDO` turns `LIKE` into `ILIKE` on PostgreSQL.
- `scripts/mysql-to-postgres.php` and `npm run db:pg`: generate `backend/database/postgres/schema.sql`
  and `seed.sql` from the MySQL files, or convert a `mysqldump`. RLS is enabled on every table.
- **Supabase project `heritagebd`** (Singapore) with the schema and a verified copy of the local data
  (50 tables, 727 rows).
- `render.yaml` (Render Blueprint); the Docker image now includes `pdo_pgsql`. `vercel.json` forwards
  `/api/*` to Render so the frontend needs no `VITE_API_URL` and no CORS setup.
- `backend/tests/api_smoke.php` / `npm run test:api`: 121 end-to-end HTTP checks. **They pass on both
  MySQL and PostgreSQL**, including on a PostgreSQL copy of the real data.
- `assetUrl()` helper in `src/services/api.ts`.
- Dev dependencies `@electric-sql/pglite` + `pglite-socket` for a local PostgreSQL test server.

### Changed

- The controllers' MySQL-only SQL is now portable: date maths moved to PHP (`DATE_ADD`, `DATE_SUB`,
  `DATE_FORMAT`, `MONTH`/`YEAR`/`CURDATE`), double-quoted literals became single-quoted, and the two
  upserts branch per database.
- `docs/deploy-vercel.md` rewritten for Vercel + Render + Supabase, plus updates to setup, database,
  security, contributing, architecture and diagrams (new deployment diagram).

### Fixed

- **Render never came online / Vercel showed 502.** A Supabase password containing `@` or `#`
  breaks a `postgresql://` URI, and the old health check (`/api/payment-terms`) needed the database,
  so the service never became healthy. Now: `DB_PASS` (overrides any password in `DATABASE_URL`, no
  URL-encoding needed) and a database-free `/api/health` health check.
- **Images no longer depend on the API being awake.** The committed images are copied into the
  frontend build (`scripts/build-image-manifest.mjs`, runs as `prebuild`) and served by Vercel from
  `/uploads/...`; `src/services/api.ts` uses them via `imageManifest.json` and falls back to the
  API for later uploads. (Loading them from GitHub needs a public repo; set `VITE_IMAGE_BASE_URL`.)
- **Supabase performance advisor:** indexed all 42 unindexed foreign keys and gave the 12 link tables
  (tags, areas, destinations) an `id` primary key. Applied to the `heritagebd` project; fresh installs
  get it from `postgres/schema.sql` (the converter now indexes foreign keys) and MySQL from
  migration `008`. Remaining advisor notes are informational: unused indexes (no traffic yet) and
  RLS-with-no-policies (intentional).
- **Vercel build failed** (`ERR_PNPM_OUTDATED_LOCKFILE`): `pnpm-lock.yaml` now includes the PGlite
  dev dependencies.
- **Admin and vendor image updates were rejected.** Event, story, place and homepage image endpoints
  only accepted absolute `http(s)` URLs, but the frontend sends uploads as relative
  `/api/product-images/<id>` paths, so "Change photo" failed with "valid URL required". A shared
  `is_image_ref()` now accepts both.
- **Broken homepage hero.** The default hero and map images were Unsplash photos that no longer exist.
  The defaults (API and frontend fallback) now use project images: Lalbagh Fort and the Sylhet tea gardens.
- **Orphan rows in the seed.** Three reviews and one pre-order referenced users that didn't exist
  (MySQL accepted them with foreign-key checks off). The missing demo users were added to `seed.sql`
  and the local database.
- Migration 002 referenced a non-existent `guide_bookings.updated_at` (fixed earlier).

## [Unreleased] — 2026-10-24

### Added — local foods and products by area

- **Traditional foods**: new `local_foods` table with 32 reference dishes, sweets, drinks, fruits and
  produce across all 8 divisions (English and Bangla names, where to try them). Admins manage them in
  **Admin → Traditional Foods**. Migration `006_local_foods.sql`.
- **Area lookup** (`helpers/areas.php`): 8 divisions, 64 districts, alternate spellings and landmarks.
  New endpoints `GET /areas`, `GET /areas/resolve`, `GET /local-foods`, and admin CRUD.
- **`area` filter on `/products`** (+ `scope`, `exact`): a district's own products first, then the rest
  of its division, tagged `areaMatch`.
- **"Taste & take home from …" section** (`LocalTaste.tsx`) in the trip planner result (always shown,
  not only with Ready to Pick), on the place page, and in the shop.
- **Shop area filter**: division chips and a district dropdown, kept in the URL (`/shop?area=Sylhet`).
- Place page Pre-Order tab now lists the place's area instead of the first four products nationwide.
- Demo data: Chattogram vendor (`ctg@example.com`) with 5 products; products linked to heritage
  places in the same district.
- `docs/diagrams.md`: 13 Mermaid UML diagrams. ASCII diagrams in the other docs replaced with links.

### Fixed — Docker image had no images

- `backend/Dockerfile` was built with `backend/` as context and pointed uploads at an empty folder,
  so every image would 404 on Render. It now builds from the repo root and copies
  `heritagebd-data/uploads/products` and `/profiles` into the image; a root `.dockerignore` sends only
  those and `backend/`. On Render set Docker Build Context Directory to `.`. Not test-built here
  (Docker unavailable on the dev machine).
- New guide: [deploy-vercel.md](deploy-vercel.md).

### Changed — demo images are local

- The 40 distinct Unsplash image URLs used by the database and `seed.sql` were downloaded into
  `heritagebd-data/uploads/products` (named by a hash of the URL) and are served by the API.
  Migration `007_local_demo_images.sql` rewrites existing databases; `seed.sql` was updated
  (88 links). The development database has 007 applied.
- 9 of those URLs (5 photos) had been deleted by Unsplash and were already showing as broken images.
  They now use a HeritageBD "Photo coming soon" placeholder that admins can replace.
- Verified: 0 external image URLs remain in the database; all 74 distinct images it references return
  HTTP 200 from the API; a fresh install from `schema.sql` + `seed.sql` has no external links.

### Fixed — deployment

- Uploaded product and profile images (61 files, about 9.5 MB) were git-ignored, so a deployment had
  none of the images the database refers to. They are now tracked; private documents stay ignored.
- A production build without `VITE_API_URL` pointed every API call and image at
  `http://localhost:8080`. It now falls back to the site's own origin (development is unchanged).
- Browser tab title was "Figma Make App"; it's now "HeritageBD – Explore Bangladesh's Heritage".
- Audit: all 50 uploaded-image references in the database are relative and every referenced file
  exists in the project; the other 41 were `images.unsplash.com` links (now local, see above).

### Fixed — migration 002

- `002_commission_settlement.sql` read `guide_bookings.updated_at`, which doesn't exist, so it failed
  partway on every database. It now uses `created_at` for back-filled guide settlements.
- The development database now has 002, 003 and 006 applied. Verified there: checkout holds a 20%
  advance (৳80 of ৳400 incl. ৳120 delivery), vendor cancellation refunds it and restores stock, and
  the shop shows Sylhet's 4 foods and 2 products.

### Fixed — images

- All 50 uploaded-image references in the local database were absolute (`http://localhost:8080/...`)
  and broke on any other host or port. Applied `004_portable_image_paths.sql` (after its prerequisites
  `add_vendor_shop_cover_image` and `add_site_image_settings`) so they're relative.
- 2 profile photos and 7 private documents existed only in the old sibling folder
  `../heritagebd-data/uploads`; they're now copied into the project's `heritagebd-data/uploads`. The
  sibling folder was left in place.

### ⚠ Upgrade steps for existing databases

1. Apply `backend/database/migrations/005_auth_hardening.sql` **once**, before deploying the new
   backend code. Without it, login returns a 500 (the `auth_attempts` table is missing) and existing
   sessions stop matching (tokens are now looked up by hash). The migration hashes existing tokens in
   place, so nobody is signed out.
2. Apply `006_local_foods.sql` for the traditional foods sections.
3. Optionally set `APP_TIMEZONE` (defaults to `Asia/Dhaka`).

### Fixed

- **Pre-order "arrived" step was unreachable.** Tourists were rejected because only cancellation was
  allowed for them, and vendors were missing from the role list for `arrived`, so only an admin could
  move a pre-order past `ready_for_pickup`. Tourists and the owning vendor can now mark arrival
  (`preorders_controller.php`).
- **PHP/MySQL timezone mismatch.** XAMPP's PHP defaults to Europe/Berlin while MySQL ran on
  Asia/Dhaka, so PHP's "today" disagreed with the database (a guide could not finish a same-day tour
  late at night) and token expiry was written in a different timezone from the one it was checked
  in. PHP and the MySQL session now share `APP_TIMEZONE` (`config/database.php`).
- **`schema.sql` could not be re-imported.** `commission_settings` and `settlements` had no
  `DROP TABLE IF EXISTS`, so a second import failed, despite the README saying re-import resets the database.
- **Adding an unknown product to the cart returned 500.** Now returns 404, or 409 when out of stock.
- **60 TypeScript errors.** `useApiData` inferred its type from the `any`-typed fetcher instead of
  the fallback value, which made results from the hook untyped. It now uses `NoInfer`, and the
  remaining callbacks are typed. `npm run typecheck` passes.

### Security

- Bearer tokens are stored as SHA-256 hashes; a database leak no longer exposes live sessions.
- Rate limiting for auth (15-minute window, HTTP 429 with `Retry-After`):
  - login: 5 failures per email, 20 per IP
  - forgot-password: 3 requests per email, 10 per IP
  - reset-password: 5 wrong codes per email, 20 per IP
- Expired tokens, used or expired reset codes and day-old attempt rows are purged opportunistically on
  login (`purge_expired_auth_rows`).

### Changed

- Route-level code splitting with `React.lazy`: the main bundle went from 1,241 KB to 334 KB
  (100 KB gzipped). Pages load on first visit behind a spinner.
- `PaymentTerms` type exported from `src/services/api.ts`.
- Removed a no-op `INSERT … WHERE 0` from tourist registration.
- `.gitignore` expanded (env variants, uploads, logs, editor/OS files).

### Added

- `npm run typecheck` script.
- `backend/helpers/throttle.php`, `auth_attempts` table, `idx_auth_tokens_expires` index.
- `docs/` folder: architecture, setup, frontend, API, database, workflows, security, known issues,
  contributing, this changelog.

### Verified

Run end to end against a temporary copy of the seeded database on the PHP built-in server:

- Marketplace order: ৳470 total → ৳94 advance held → after the tourist confirms receipt, admin ৳47,
  vendor ৳47 from the advance plus ৳376 cash. The vendor cannot release the advance.
- Guide booking: ৳2,500 → ৳500 advance → admin ৳250, guide ৳250 + ৳2,000 cash; the guide cannot mark
  the booking completed directly.
- `/earnings/me` (vendor, guide) and `/admin/earnings` report those amounts.
- Pre-order: tourist and vendor can mark arrival, another vendor gets 403, a wrong QR gets 422, the
  correct QR passes.
- Throttling returns 429 on the 6th bad login or reset attempt; logout invalidates the token.
- Areas and foods (fresh schema and seed): spellings and landmarks resolve correctly (Chittagong,
  Comilla, Sreemangal, Paharpur); `area=Cumilla` lists Cumilla first, then nearby; `exact=1` narrows;
  products and category filters combine; admin create/update/delete works and non-admins get 403.
- In the browser: shop division chips and district dropdown, the place page section (Mainamati →
  Cumilla) and the trip planner (Cox's Bazar), with both tabs.
- All 13 Mermaid diagrams render with mermaid 10.9.
