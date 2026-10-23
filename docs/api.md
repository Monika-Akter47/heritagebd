# API reference

Base path: `/api`. Authenticated endpoints need `Authorization: Bearer <token>` (returned by
register/login, valid 30 days). The source of truth is the route table in
[`backend/index.php`](../backend/index.php).

Auth column: **–** public · **✓** any signed-in user · role names = required role(s).
"Owner" means the controller additionally checks the caller owns or participates in the record.

## Auth and account

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | – | `name, email, password (≥8), role` (`tourist`/`vendor`/`guide`; `admin` rejected). Optional BD phone `01[3-9]XXXXXXXX`. Vendors/guides start `pending`. Returns `{ user, token }` |
| POST | `/auth/login` | – | `{ email, password }` → `{ user, token }`. Suspended → 403 |
| POST | `/auth/logout` | ✓ | Deletes the current token |
| GET | `/auth/me` | ✓ | `{ user }` |
| PUT | `/auth/me` | ✓ | Update own profile |
| PUT | `/auth/password` | ✓ | `{ currentPassword, newPassword }`; signs out other devices |
| POST | `/auth/forgot-password` | – | `{ email }`; mails a 6-digit code (hashed, 15-min expiry) |
| POST | `/auth/reset-password` | – | `{ email, otp, newPassword }` |
| GET / PUT | `/vendor/profile` | vendor | Shop details, onboarding fields, logo/cover |

## Uploads and documents

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/documents` | ✓ | Multipart `file`, `documentType` (`identity`, `business_license`, `guide_license`, `other`). ≤10 MB, stored privately |
| GET | `/documents` | ✓ | Own documents |
| GET | `/admin/documents` | admin | All documents |
| GET | `/admin/documents/{id}/download` | admin | File stream |
| POST | `/product-images` | ✓ | JPG/PNG/WebP ≤5 MB → `{ url: "/api/product-images/<32 hex>" }` |
| GET | `/product-images/{id}` | – | Serves image |
| POST | `/profile-images` | ✓ | Same limits, for avatars |
| GET | `/profile-images/{id}` | – | Serves image |

## Content

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/places` | – | Search/filter list |
| GET | `/places/saved` | ✓ | My saved places |
| GET | `/places/{id}` | – | Detail |
| POST / PUT / DELETE | `/places[/{id}]` | admin | Manage places |
| POST | `/places/{id}/save` | ✓ | Toggle → `{ saved }` |
| GET | `/places/{id}/reviews` | – | Place reviews |
| GET | `/categories` | – | Place categories with counts |
| GET | `/events`, `/events/{id}` | – | Events |
| GET | `/stories`, `/stories/{id}` | – | Stories |
| GET | `/site-content/homepage-images` | – | Hero, map, testimonial images |

## Areas and traditional foods

Area parameters (shared by `/local-foods` and `/products`):

| Param | Meaning |
|---|---|
| `area` | Division, district or landmark: `Chattogram`, `Chittagong`, `Sreemangal`, `Lalbagh Fort & Old Dhaka` |
| `scope=district` | Treat a name shared by a division and a district as the district ("Dhaka" district rather than Dhaka division) |
| `exact=1` | Only the district itself; by default a district is widened to its division with its own items first |

Items returned for an area carry `areaMatch: "local" | "nearby"`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/areas` | – | `[{ division, districts[] }]`, all 8 divisions / 64 districts |
| GET | `/areas/resolve?q=&scope=` | – | `{ type: district\|division, name, division, districts[] }` or `null` |
| GET | `/local-foods` | – | Area params plus `type` (`dish`, `sweet`, `snack`, `drink`, `fruit`, `ingredient`), `featured=1`, `limit` (≤200). Unknown area → `[]`; bad type → 422 |
| POST | `/admin/local-foods` | admin | `{ name, nameLocal?, district, type?, description, whereToTry?, image?, featured? }`; division is derived from the district |
| PUT | `/admin/local-foods/{id}` | admin | Partial update |
| DELETE | `/admin/local-foods/{id}` | admin | Remove |
| GET | `/payment-terms` | – | Current advance and commission % per flow |

## Guides and bookings

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/guides` | – | Verified, active guides. `available=1&startDate=&endDate=` excludes guides with conflicting bookings |
| GET | `/guides/{id}` | – | Profile. Contact details only to self/admin; location only if sharing is on, rounded to ~1 km |
| PUT | `/guides/{id}` | self / admin | Profile, availability, location sharing, public phone |
| POST | `/bookings` | tourist | Rejects overlapping pending/accepted bookings for the same guide |
| GET | `/bookings` | ✓ | As tourist or guide |
| PUT | `/bookings/{id}` | owner | `{ status }`, see [workflows](workflows.md#guide-bookings) |
| GET / POST | `/guide-payments` | ✓ | Legacy manual payment registry |
| PUT | `/guide-payments/{id}/confirm` | ✓ | Legacy |

## Marketplace

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products`, `/products/{id}` | – | Products from verified vendors. Filters: `category`, `vendorId`, `district` (exact), `featured`, `preorder`, `destination` (`a\|b` terms), **`area`** (+ `scope`, `exact`, see above), `search`, `minPrice`, `maxPrice`, `sort`, `limit`, `offset` |
| POST | `/cart` | ✓ | Unknown product → 404, out of stock → 409 |
| POST / PUT / DELETE | `/products[/{id}]` | vendor (own) / admin | Ready-to-Pick discount 0–90% |
| GET / POST / DELETE | `/cart` | ✓ | View, add `{ productId, quantity }`, clear |
| PUT / DELETE | `/cart/{productId}` | ✓ | Set quantity / remove |
| POST | `/orders` | ✓ | Checkout from server cart. One order per vendor, ৳120 delivery each, prices from DB, stock reserved atomically, 20% advance held |
| GET | `/orders` | ✓ | Role-aware list |
| GET | `/orders/{id}` | owner | Detail |
| PUT | `/orders/{id}` | owner | Status/tracking, see [workflows](workflows.md#marketplace-orders) |

## Ready When You Arrive (pre-orders)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/preorders/settings` | – | Platform settings |
| PUT | `/preorders/settings` | admin | Update settings |
| POST | `/preorders` | tourist | Creates pre-order with a 30% advance and QR code |
| GET | `/preorders` | ✓ | Role-aware list |
| GET / PUT | `/preorders/{id}` | owner | Status changes, see [workflows](workflows.md#pre-orders-ready-when-you-arrive) |

## Social

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/reviews?targetType=&targetId=` | – | `targetType` = `place`/`product`/`guide`/`vendor` |
| GET | `/reviews?mine=1` | ✓ | My reviews |
| POST | `/reviews` | ✓ | One per user per target, needs a delivered order or completed booking; place reviews disabled |
| GET / POST | `/conversations` | ✓ | List / start `{ participantId }` |
| GET / POST | `/conversations/{id}/messages` | participant | Read / send `{ content, attachments }` |
| GET | `/notifications` | ✓ | Mine |
| PUT | `/notifications/{id}/read` | ✓ | Mark one read |
| PUT | `/notifications/read-all` | ✓ | Mark all read |

## Trip planner

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / POST | `/trips` | ✓ | List / create; tourists may share a plan with an approved guide |
| GET / PUT / DELETE | `/trips/{id}` | owner / assigned guide | Days, stops, times; guide accepts/declines |

## Earnings

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/earnings/me` | vendor / guide | Totals, settlements, monthly breakdown |
| GET | `/admin/earnings` | admin | Platform-wide |
| GET / PUT | `/admin/commission-settings` | admin | `{ settings: [{ flow, advancePercent, commissionPercent }] }` |

## Admin

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/stats` | Dashboard counters |
| GET | `/admin/users` | List users |
| PUT | `/admin/users/{id}/status` | `active` / `suspended` (suspension also revokes access) |
| GET | `/admin/guides`, `/admin/guides/pending` | Guides |
| PUT | `/admin/guides/{id}/verify` | `verified` / `rejected` |
| GET | `/admin/vendors`, `/admin/vendors/pending` | Vendors |
| PUT | `/admin/vendors/{id}/verify` | `verified` / `rejected` |
| GET / DELETE | `/admin/reviews[/{id}]` | Moderate reviews |
| POST / PUT / DELETE | `/admin/events[/{id}]` | Manage events |
| POST / PUT / DELETE | `/admin/stories[/{id}]` | Manage stories |
| PUT | `/admin/homepage-images` | Replace homepage imagery |

## Errors

| Status | Meaning |
|---|---|
| 401 | Missing, invalid or expired token, or suspended user |
| 403 | Wrong role or not the owner |
| 404 | Unknown record or route (`Not found: METHOD /path`) |
| 409 | Conflict (duplicate email, terminal pre-order state) |
| 422 | Validation failure or disallowed status transition |
| 429 | Too many auth attempts; wait for the `Retry-After` seconds (900) |
| 500 | Server error (details only in the PHP error log) |
