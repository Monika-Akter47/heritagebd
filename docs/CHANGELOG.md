# Changelog

All notable changes to HeritageBD. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); dates are YYYY-MM-DD.

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
