# Known issues and gaps

Last reviewed 2026-10-24. Items fixed in the same review are listed at the bottom; details are in
[CHANGELOG.md](CHANGELOG.md).

## Open

### 1. Payments are simulated

`PAYMENTS_DEMO_MODE = true` in `backend/helpers/payments.php`; every advance "succeeds". The split and
settlement logic is real and tested, but no money moves. Integrate bKash/Nagad/card, store the gateway
transaction ID, handle failures and refunds, then set the flag to `false`.

### 2. Token lives in localStorage for 30 days

Any injected script can read it. Shorter expiry with refresh rotation, or an `HttpOnly` cookie, would
reduce exposure.

### 3. Rate limiting is per app instance and DB-backed

It is good enough for a single server. Behind a load balancer, make sure `REMOTE_ADDR` is the real
client IP (configure the proxy), otherwise every request shares one IP bucket.

### 4. Documentation drift in the READMEs

The top-level README and `backend/README.md` were corrected for React version, dev port, mock-data
usage, table count and the guide-completion step. Re-check them when features change.

### 5. Pre-order `refunded` status is unreachable

`PREORDER_TRANSITIONS` never lists `refunded` as a next state (cancelled → `[]`), so even an admin
can't set it, although `PREORDER_TRANSITION_ROLES` reserves it for admins. Cancelling already marks the
advance `refunded`; decide whether `cancelled → refunded` (admin) should be allowed, and add it.

### 6. Food photos

The 32 reference foods ship without photos (an emoji per type is shown). Add real photos from
Admin → Traditional Foods.

### 7. Smaller items

- The catch-all route `*` renders Landing instead of a 404 page.
- Most API responses are still `any` in `src/services/api.ts`. The interfaces in `src/types` exist
  but aren't wired to the client.
- The only automated test is `backend/tests/settlement_smoke.php`; there is no frontend test suite
  and no CI.
- No migration runner or `schema_migrations` table.
- Very large page components (`TripPlanner.tsx`, `AdminDashboard.tsx`, `AdminSections.tsx`,
  `VendorDashboard.tsx`).
- `cart_index` runs one product query per cart line (N+1). Fine for small carts.
- `.env copy.example` duplicates `.env.example`, and `src/imports/pasted_text/preorder-feature.md`
  duplicates `ready-when-you-arrive.md` (both confirmed byte-identical).
- `scripts/generate-seed.cjs` is stale; regenerating `seed.sql` would drop hand-added data.

## Fixed on 2026-10-24

- Pre-order `arrived` step blocked for tourists and vendors.
- No rate limiting on login / forgot / reset password.
- Auth tokens stored in plain text; expired rows never purged.
- PHP (Europe/Berlin) and MySQL (Asia/Dhaka) timezone mismatch.
- `schema.sql` failed on re-import.
- Unknown product in cart → 500.
- 60 TypeScript errors.
- 1.24 MB single JS bundle.
- Trip planner only showed pre-order products, and only with "Ready to Pick" selected → now always
  shows traditional foods and local products for the destination's area.
- Uploaded image URLs stored as absolute `http://localhost:8080/...`, and some uploads living outside
  the project → relative paths, files consolidated into the project's uploads folder.
