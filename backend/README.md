# HeritageBD Backend (PHP + MySQL)

A complete REST API backend for the HeritageBD frontend: authentication,
heritage places, tour guides & bookings, marketplace (products/cart/orders),
"Ready When You Arrive" pre-orders, events, stories, reviews, trip planner,
notifications, in-app chat, and an admin panel API.

## 1. Requirements

- PHP 8.0+ with the `pdo_mysql` extension
- MySQL 8.0+ or MariaDB 10.4+
- Apache (with `mod_rewrite`) or the PHP built-in server for local dev

## 2. Set up the database

```bash
mysql -u root -p -e "CREATE DATABASE heritagebd CHARACTER SET utf8mb4;"
mysql -u root -p heritagebd < backend/database/schema.sql
mysql -u root -p heritagebd < backend/database/seed.sql   # optional demo data
```

`seed.sql` is development-only: it loads demo accounts and content, so never
run it against a production database. It loads the same demo content that used to live in `src/data/mockData.ts`
(vendors, heritage places, guides, products, events, stories, reviews, a sample
trip plan, notifications, a chat conversation, and pre-orders), so the app looks
fully populated immediately. Every seeded account uses the password:

```
password123
```

Development-only demo logins: `tourist@heritagebd.com`, `rahima@muslinhouse.com` (vendor),
`arif@guide.com` (guide), `admin@heritagebd.com` (admin).

Existing databases created before password-reset codes were hashed must widen
the reset-code column once before using password recovery:

```sql
ALTER TABLE password_resets MODIFY otp_code VARCHAR(255) NOT NULL;
```

Existing databases should also apply the review uniqueness migration once. It
retains the oldest review for each user/listing pair before adding the unique
constraint:

```bash
mysql -u root -p heritagebd < backend/database/migrations/2026_02_unique_reviews.sql
```

To enable shop reviews for delivered orders on existing databases, apply:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_vendor_reviews.sql
```

Tourists can review a shop once after an order from that vendor is delivered.
The vendor rating and review count are recalculated from its shop reviews and
shown alongside vendor information in the marketplace.

Existing databases must add the regular-order delivery fee column before using
the updated checkout:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_order_delivery_fee.sql
```

Existing databases must add vendor onboarding fields before vendors can submit
their business details and product categories:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_vendor_onboarding_details.sql
```

Existing databases must add trip start and end times before using the saved-trip
schedule editor:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_trip_plan_times.sql
```

Existing databases must add guide responses to shared trip plans:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_trip_guide_response.sql
```

Existing databases must create the manual guide-payment registry:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_guide_payments.sql
```

Existing databases must install the commission settings, advance snapshots,
and settlement ledger before using the unified payment flows:

```bash
mysql -u root -p heritagebd < backend/database/migrations/002_commission_settlement.sql
```

Existing databases must also add tourist delivery confirmation for marketplace
orders:

```bash
mysql -u root -p heritagebd < backend/database/migrations/003_order_tourist_delivery_confirmation.sql
```

Existing databases should normalize uploaded-image URLs before moving the
project or database to another host:

```bash
mysql -u root -p heritagebd < backend/database/migrations/004_portable_image_paths.sql
```

New uploads and private documents are saved under the ignored
`heritagebd-data/uploads/` directory at the project root by default, outside
the API web root. Set `HERITAGE_UPLOAD_DIR` to an absolute writable directory
when uploads need to persist outside the project. The database stores upload
paths such as `/api/product-images/<id>` rather than a host-specific URL, and
the frontend resolves them using `VITE_API_URL`. Keep the upload directory
writable; it is excluded from source control and does not contain the demo seed
images.
Seeded demo images use public HTTPS URLs and require internet access.

The default terms for new marketplace orders, Ready to Pick pre-orders, and
guide bookings are respectively 20%/10%, 30%/10%, and 20%/10% (advance /
platform commission). Admins can change these rates in Earnings & Commission;
existing records retain their saved percentages. On successful completion or
delivery, the platform commission is deducted from the held online advance,
the remaining advance is released to the partner, and the partner's cash
balance is recorded separately. Settlement insertion and advance release are
performed together transactionally and are protected against duplicate
settlements.

The migration creates settlement records for previously completed Ready to
Pick orders and guide bookings, and marks previously cancelled advances as
refunded.

For regular marketplace orders, checkout holds a 20% advance on the platform.
After the vendor marks an order delivered, the tourist must confirm receipt
from order tracking before that advance is settled. At the default 10%
commission setting, the advance is split into 10% of the order total for the
platform and 10% for the vendor; the remaining 80% is collected in cash at
delivery. Vendor delivery status alone never releases the advance. Historical
orders already settled before this change are migrated to completed.

For guide bookings, the guide marks the tour finished after its end date. The
tourist then confirms completion and that the cash balance was paid directly
to the guide. Only this confirmation releases the held advance and records the
settlement. A guide cannot directly mark a booking completed.

Online advance collection is currently a demo-mode stub (`PAYMENTS_DEMO_MODE`
in `helpers/payments.php`) that always simulates success. No bKash, Nagad, or
card gateway is connected; do not treat the stored demo advances as actual
captured funds. Configure and verify a real gateway before production use.
The legacy guide-payment registry and routes are retained for old records,
but new guide earnings use the settlement ledger.

Run the split-calculation smoke test with PHP:

```bash
php backend/tests/settlement_smoke.php
```

Existing databases must apply the auth hardening migration **before** running
the current API. It hashes stored session tokens in place (nobody is signed
out) and creates the `auth_attempts` table used for login/reset rate limiting:

```bash
mysql -u root -p heritagebd < backend/database/migrations/005_auth_hardening.sql
```

Existing databases need the traditional foods table (32 reference foods
included; safe to re-run):

```bash
mysql -u root -p heritagebd < backend/database/migrations/006_local_foods.sql
```

Existing databases must create the private uploaded-document registry:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_user_documents.sql
```

Existing databases must add the vendor shop cover image field before vendors can
save both their shop logo and cover image:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_vendor_shop_cover_image.sql
```

Existing databases must add the guide phone-sharing preference before enabling
public contact numbers on guide profiles:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_guide_public_phone.sql
```

Existing databases must create the homepage image settings table before using
the admin homepage image editor:

```bash
mysql -u root -p heritagebd < backend/database/migrations/add_site_image_settings.sql
```

Admins can replace the homepage hero and map-preview images, heritage-place
photos, event/story cover photos, and product photos. Product owners can
continue managing their own product images. Uploads accept JPG, PNG, or WebP
images up to 5 MB; uploaded image URLs are persisted with the corresponding
content record.

Guide phone numbers remain private unless the guide explicitly opts in during
onboarding or enables public phone sharing from the guide dashboard.

Uploaded verification files are stored outside the application web root in
`heritagebd-data/uploads` by default. Set `HERITAGE_UPLOAD_DIR` to a persistent,
PHP-writable directory on the API host when needed. Do not expose this directory
through the web server; documents are served only through the admin-authorized
download endpoint. Vendor and guide profile photos are uploaded through the
authenticated profile-image endpoint, stored separately, and served publicly
by an opaque image ID because profile photos appear on public listings. For
existing installations, the previous sibling `heritagebd-data/uploads`
location remains readable after upgrading. The API validates document and
image MIME types and enforces a 10 MB document / 5 MB image limit. Back up the
uploads directory together with the database.

Regular marketplace checkout charges ৳120 delivery per vendor shipment. Vendors
must provide an estimated delivery date when confirming an order. Order status
updates follow the sequence placed → confirmed → preparing → shipped → out for
delivery → delivered → tourist-confirmed; cancellation is available before
preparation begins. A vendor marking an order delivered does not settle the
advance.

Marketplace checkout creates a separate order for each vendor in the cart. This
keeps vendor status changes scoped to that vendor while tourists and admins can
see all applicable orders. Vendors and guides must be verified and active to
appear in public listings or receive new orders/bookings. Product and shop
reviews require a delivered order from the reviewed product or vendor, and guide
reviews require a completed booking. Place reviews are disabled until the
platform has a verifiable visit record.

Product stock is reserved transactionally when a regular or Ready to Pick
order is placed, so available inventory decreases immediately and concurrent
orders cannot oversell it. Cancelling an eligible order restores its reserved
quantity. Vendors can set a 0–90% Ready to Pick discount; the product's sale
price and original price are stored in the existing product pricing columns and
the discounted price is used by both checkout workflows.

## 3. Configure the database connection

The backend reads connection details from environment variables (with sane
local-dev fallbacks baked into `backend/config/database.php`):

| Variable  | Default     |
|-----------|-------------|
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306`      |
| `DB_NAME` | `heritagebd`|
| `DB_USER` | `root`      |
| `DB_PASS` | *(empty)*   |
| `CORS_ORIGIN` | `*` |
| `HERITAGE_UPLOAD_DIR` | `heritagebd-data/uploads` |
| `APP_TIMEZONE` | `Asia/Dhaka` (applied to PHP and the MySQL session) |

Set these as real environment variables on your host, or simply edit the
`define(...)` fallback values in `backend/config/database.php` directly.

## 4. Run the API

**Local development** (from the `backend/` folder):

```bash
php -S localhost:8080 index.php
```

The API is now at `http://localhost:8080/api/...`.

**Apache / shared hosting (e.g. cPanel):** upload the `backend/` folder as-is.
The included `.htaccess` routes every request through `index.php`. Point a
subdomain or folder (e.g. `api.yoursite.com` or `yoursite.com/backend`) at it.

**Nginx:** add an equivalent rewrite, e.g.:

```nginx
location /backend/ {
    try_files $uri $uri/ /backend/index.php?$query_string;
}
```

## 5. Connect the React frontend

Copy `.env.example` to `.env` at the project root and set `VITE_API_URL` to
wherever you're running the backend:

```
VITE_API_URL=http://localhost:8080
```

Then `npm run dev` as usual. `src/services/api.ts` is the typed client used
throughout the app; `src/context/AppContext.tsx` now performs real
login/register/logout, and keeps cart + notifications in sync with the server
whenever a user is signed in.

> Note: every page reads from the live API. The only remaining static data is
> `mockEvents` (a development fallback when `/events` fails, used by Landing,
> Events and EventDetail), `mockPreOrderSettings` (admin defaults before the API
> responds) and `preOrderStatusConfig` (status labels and colours).

Password-reset codes are sent using PHP's configured `mail()` transport and are
stored as hashes with a 15-minute expiry. Configure a working mail transport on
the API host before enabling password recovery in production.

## 6. API reference

All endpoints are prefixed with `/api`. Authenticated endpoints expect
`Authorization: Bearer <token>` (the token returned from login/register).
Responses are always `{ "success": true, "data": ... }` or
`{ "success": false, "message": "..." }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create account (`tourist`/`vendor`/`guide`) |
| POST | `/auth/login` | – | Login, returns `{ user, token }` |
| POST | `/auth/logout` | ✓ | Revoke current token |
| GET | `/auth/me` | ✓ | Current user |
| PUT | `/auth/me` | ✓ | Update profile |
| POST | `/auth/forgot-password` | – | Request OTP |
| POST | `/auth/reset-password` | – | Reset with OTP |
| GET | `/places` | – | List/search/filter heritage places |
| GET | `/places/{id}` | – | Place detail |
| POST/PUT/DELETE | `/places[/{id}]` | admin | Manage places |
| POST | `/places/{id}/save` | ✓ | Toggle saved place |
| GET | `/places/saved` | ✓ | My saved places |
| GET | `/places/{id}/reviews` | – | Reviews for a place |
| GET | `/categories` | – | Place categories with counts |
| GET | `/areas` | – | Divisions with their districts |
| GET | `/areas/resolve?q=` | – | Resolve a name/landmark to a district or division |
| GET | `/local-foods?area=&scope=&exact=&type=` | – | Traditional foods for an area |
| POST/PUT/DELETE | `/admin/local-foods[/{id}]` | admin | Manage traditional foods |
| GET | `/guides` | – | List verified guides; `available=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` filters guides accepting bookings without a date conflict |
| GET | `/guides/{id}` | – | Guide profile |
| PUT | `/guides/{id}` | ✓ (self/admin) | Update guide profile |
| POST | `/bookings` | tourist | Book a guide |
| GET | `/bookings` | ✓ | My bookings (as tourist or guide) |
| PUT | `/bookings/{id}` | ✓ | Guide: accept/reject, then `awaiting_confirmation` after the last day; tourist: cancel, or confirm `completed` (releases the advance) |
| GET | `/products` | – | List/search/filter marketplace products; `area=` lists an area's products (district first, then its division) |
| GET | `/products/{id}` | – | Product detail |
| POST/PUT/DELETE | `/products[/{id}]` | vendor/admin | Manage products |
| GET/POST | `/cart` | ✓ | View / add to cart |
| PUT/DELETE | `/cart/{productId}` | ✓ | Update qty / remove item |
| DELETE | `/cart` | ✓ | Clear cart |
| POST | `/orders` | ✓ | Checkout (creates order from cart) |
| GET | `/orders` | ✓ | My orders (role-aware) |
| GET | `/orders/{id}` | ✓ | Order detail |
| PUT | `/orders/{id}` | vendor/admin | Update status/tracking |
| GET | `/preorders/settings` | – | Pre-order platform settings |
| POST | `/preorders` | tourist | Create a pre-order |
| GET | `/preorders` | ✓ | My pre-orders (role-aware) |
| GET/PUT | `/preorders/{id}` | ✓ | View/update a pre-order |
| GET | `/events` | – | List/search/filter events |
| GET | `/events/{id}` | – | Event detail |
| GET | `/stories` | – | List/search/filter stories |
| GET | `/stories/{id}` | – | Full story |
| GET | `/reviews?targetType=&targetId=` | – | Reviews for place/product/guide |
| POST | `/reviews` | ✓ | Create a review (updates target rating) |
| GET/POST | `/trips` | ✓ | List / create plans; tourists may share plans with approved guides |
| GET/PUT/DELETE | `/trips/{id}` | ✓ | Owners manage plans; assigned guides accept/decline; either party can complete an accepted ended tour |
| GET | `/notifications` | ✓ | My notifications |
| PUT | `/notifications/{id}/read` | ✓ | Mark one read |
| PUT | `/notifications/read-all` | ✓ | Mark all read |
| GET/POST | `/conversations` | ✓ | List / start a conversation |
| GET/POST | `/conversations/{id}/messages` | ✓ | Read / send messages |
| GET | `/admin/stats` | admin | Dashboard counters |
| GET | `/admin/users` | admin | List users |
| GET | `/admin/guides/pending` | admin | Guides awaiting verification |
| PUT | `/admin/guides/{id}/verify` | admin | Approve/reject a guide |
| GET | `/admin/vendors/pending` | admin | Vendors awaiting verification |
| PUT | `/admin/vendors/{id}/verify` | admin | Approve/reject a vendor |

## 7. Project structure

```
backend/
├── index.php                  # front controller / router
├── .htaccess                  # Apache rewrite (routes everything to index.php)
├── config/
│   ├── database.php           # PDO connection
│   └── cors.php                # CORS headers
├── helpers/
│   ├── auth.php               # bearer-token auth (hashed at rest), role guards
│   ├── throttle.php           # auth attempt rate limiting
│   ├── areas.php              # BD divisions/districts, aliases, area resolution
│   ├── response.php           # json_ok / json_error / body() / uuid()
│   └── notify.php             # in-app notification helper
├── controllers/                # one file per resource (see table above)
└── database/
    ├── schema.sql              # full table definitions (52 tables)
    └── seed.sql                 # demo data (hand-maintained; don't regenerate)
```

## 8. Security notes for production

- Passwords are hashed with bcrypt (`password_hash`/`password_verify`).
- Auth uses random 256-bit bearer tokens; only their SHA-256 is stored in
  `auth_tokens` (30-day expiry). Login and password reset are rate-limited.
  Consider adding refresh-token rotation for a production launch.
- Set `CORS_ORIGIN` to your real frontend origin instead of `*` once deployed.
- All queries use PDO prepared statements (no raw string interpolation of
  user input).
- Put `backend/` behind HTTPS in production; tokens are sent as plain bearer
  headers.
