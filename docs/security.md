# Security model

## Authentication

- Passwords: bcrypt via `password_hash` / `password_verify`; minimum 8 characters.
- Sessions: 256-bit random tokens (`bin2hex(random_bytes(32))`). Only `sha256(token)` is stored in
  `auth_tokens`, with a 30-day expiry. `current_user()` hashes the presented token and rejects expired
  tokens and suspended users on every request.
- Rate limiting (`helpers/throttle.php`, 15-minute window, HTTP 429):

  | Endpoint | Per email | Per IP |
  |---|---|---|
  | `POST /auth/login` (failures) | 5 | 20 |
  | `POST /auth/forgot-password` (all requests) | 3 | 10 |
  | `POST /auth/reset-password` (wrong codes) | 5 | 20 |

  A successful login or reset clears that email's counter.
- Housekeeping: about 1 in 50 logins purges expired tokens, used or expired reset codes, and attempt
  rows older than a day.
- Logout deletes the token; changing password revokes other sessions.
- Password reset: 6-digit code, stored as a hash, 15-minute expiry, single use.
- Admin accounts cannot self-register.

## Authorisation

- `require_auth()` → 401, `require_role()` → 403 (`backend/helpers/auth.php`).
- Controllers additionally check ownership (vendor owns product/order, participant in booking, chat
  member, and so on).
- The frontend `RequireRole` guard is cosmetic; never rely on it.

## Data exposure

- `public_user()` whitelists the user fields returned to clients (never the password hash).
- Guide email/phone are visible only to the guide and admins unless the guide opts in to a public phone.
- Guide location is shown only for verified, available guides with sharing on, and is rounded to
  about 1 km.
- Server errors are logged; clients get a generic message.

## Supabase

- Every table has Row Level Security enabled with **no policies**. Supabase's public Data API
  (PostgREST, reachable with the project's anon key) therefore returns nothing; the PHP API connects as
  `postgres`, which bypasses RLS. Don't add policies unless you deliberately want a table public.
- The backend connects over TLS (`sslmode=require`; `verify-full` when `DB_SSL_CA_PEM` is set) through
  the Session pooler.
- Keep the database password only in Render's `DATABASE_URL`; never in the repo or the frontend.

## Input and SQL

- All queries use PDO prepared statements with emulation disabled.
- Status changes are validated against explicit transition tables.
- Checkout ignores client prices and recomputes from the database.

## Uploads

- Images: JPG/PNG/WebP, ≤5 MB, MIME-checked, served by opaque 32-hex IDs.
- Documents: ≤10 MB, stored under `HERITAGE_UPLOAD_DIR` outside the web root, downloadable only through
  the admin endpoint.

## Production checklist

- [ ] HTTPS for both frontend and API.
- [ ] `CORS_ORIGIN` set to the exact frontend origin.
- [ ] Non-root DB user with a strong password.
- [ ] `seed.sql` **not** loaded; remove any `password123` accounts.
- [ ] `HERITAGE_UPLOAD_DIR` persistent, not web-served, backed up.
- [ ] Working mail transport for password reset.
- [ ] Real payment gateway in place of the demo stub.
- [ ] Migration `005_auth_hardening.sql` applied (MySQL) / `postgres/schema.sql` used (Supabase).
- [ ] Demo accounts' `password123` changed, admin first (list in [deploy-vercel.md](deploy-vercel.md#4-after-the-first-deploy)).
- [ ] Supabase database password reset and stored only in Render.
- [ ] Behind a proxy or load balancer, real client IP forwarded into `REMOTE_ADDR` (rate limiting depends on it).
- [ ] `APP_TIMEZONE` set if the business does not operate on Asia/Dhaka time.
- [ ] PHP `display_errors=Off`, errors to log.

See [known-issues.md](known-issues.md) for gaps found during review.
