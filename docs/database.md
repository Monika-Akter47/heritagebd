# Database

Schema: [`backend/database/schema.sql`](../backend/database/schema.sql) (drops and recreates all tables).
Demo data: [`seed.sql`](../backend/database/seed.sql), generated from `src/data/mockData.ts` by
`scripts/generate-seed.cjs`.

IDs are application-generated strings (prefixed, for example `u…` for users), not auto-increment
integers. Money columns are `DECIMAL`; the settlement code works in integer poisha (1/100 taka) to
avoid rounding drift.

## Tables by domain

| Domain | Tables |
|---|---|
| Users and auth | `users`, `auth_tokens` (SHA-256 of each token), `auth_attempts` (rate limiting), `password_resets`, `user_documents`, `admins` |
| Vendors | `vendors` |
| Guides | `guides`, `guide_languages`, `guide_specializations`, `guide_certifications`, `guide_cover_areas`, `guide_tour_types` |
| Places | `heritage_places`, `place_images`, `place_tags`, `place_nearby`, `categories`, `tourist_saved_places` |
| Products | `products`, `product_images`, `product_tags`, `product_specifications`, `product_time_slots`, `product_near_destinations` |
| Commerce | `cart_items`, `orders`, `order_items` |
| Pre-orders | `preorder_settings`, `preorders` |
| Bookings | `guide_bookings`, `guide_booking_destinations`, `guide_payments` (legacy) |
| Money | `commission_settings`, `settlements` |
| Content | `events`, `event_images`, `event_tags`, `stories`, `story_tags`, `site_settings`, `local_foods` (traditional foods by district/division; 32 reference rows ship with the schema) |
| Reviews | `reviews`, `review_photos` |
| Trips | `trip_plans`, `trip_destinations`, `trip_days`, `trip_stops` |
| Messaging | `notifications`, `conversations`, `conversation_participants`, `messages`, `message_attachments` |

## Key enums

| Column | Values |
|---|---|
| `users.role` | `tourist`, `vendor`, `guide`, `admin` |
| `users.status` | `active`, `pending`, `suspended` |
| `vendors/guides.verification_status` | `unverified`, `pending`, `verified`, `rejected` |
| `heritage_places.category` | `mosque`, `fort`, `palace`, `temple`, `monument`, `archaeological`, `natural`, `museum` |
| `products.category` | `gi-product`, `handicraft`, `clothing`, `food`, `jewelry`, `pottery`, `other` |
| `orders.status` | `placed`, `confirmed`, `preparing`, `shipped`, `out_for_delivery`, `delivered`, `completed`, `cancelled` |
| `orders.payment_method` | `bkash`, `nagad`, `card`, `cod` |
| `preorders.status` | `confirmed`, `advance_paid`, `vendor_accepted`, `preparing`, `ready_for_pickup`, `arrived`, `qr_verified`, `pickup_payment_pending`, `picked_up`, `completed`, `cancelled`, `refunded` |
| `guide_bookings.status` | `pending`, `accepted`, `rejected`, `awaiting_confirmation`, `completed`, `cancelled` |
| `*.advance_status` | `held`, `released`, `refunded` |
| `trip_plans.status` | `draft`, `planned`, `ongoing`, `completed` |
| `trip_plans.guide_response` | `pending`, `accepted`, `declined` |
| `reviews.target_type` | `place`, `product`, `guide`, `vendor` |
| `notifications.type` | `booking`, `order`, `review`, `system`, `message` |
| `local_foods.food_type` | `dish`, `sweet`, `snack`, `drink`, `fruit`, `ingredient` |
| `commission_settings.flow` / `settlements.flow` | `order`, `preorder`, `guide_booking` |

## Money model

- `commission_settings`: one row per flow with `advance_percent` and `commission_percent`
  (defaults: order 20/10, pre-order 30/10, guide booking 20/10).
- Orders, pre-orders and bookings **snapshot** those percentages at creation, so later admin changes
  don't affect existing records.
- `settlements`: one row per partner per completed source record, with gross, advance, commission,
  released advance, cash portion and partner total. See [workflows.md](workflows.md#settlement-maths).

## Migrations

There is no migration runner; apply SQL files by hand. A fresh install from `schema.sql` already
includes everything. Upgrades need these in `backend/database/migrations/`:

| File | Adds |
|---|---|
| `2026_02_unique_reviews.sql` | One review per user per target (keeps the oldest duplicate) |
| `add_vendor_reviews.sql` | Shop (`vendor`) reviews |
| `add_order_delivery_fee.sql` | `orders.delivery_fee` |
| `add_vendor_onboarding_details.sql` | Vendor onboarding fields |
| `add_trip_plan_times.sql` | Trip start/end times |
| `add_trip_guide_response.sql` | `trip_plans.guide_response` |
| `add_guide_payments.sql` | Legacy guide payment registry |
| `002_commission_settlement.sql` | `commission_settings`, `settlements`, advance snapshots; backfills settlements |
| `003_order_tourist_delivery_confirmation.sql` | Tourist confirmation step for orders |
| `add_user_documents.sql` | Private document registry |
| `add_vendor_shop_cover_image.sql` | Vendor cover image |
| `add_guide_public_phone.sql` | Guide phone-sharing opt-in |
| `add_site_image_settings.sql` | Homepage image settings |
| `004_portable_image_paths.sql` | Rewrites absolute upload URLs to relative `/api/...` paths |
| `005_auth_hardening.sql` | Hashes existing tokens in place, adds `auth_attempts` and a token-expiry index. **Required** by the current backend; run once |
| `007_local_demo_images.sql` | Points every `images.unsplash.com` image at its local copy in `uploads/products` (deleted photos → placeholder). Safe to re-run |
| `006_local_foods.sql` | Creates `local_foods` with the 32 reference foods. Safe to re-run (`IF NOT EXISTS`, `INSERT IGNORE`) |

### Checking an existing database

To see which migrations a database is missing, check for the column or table each one adds:
`settlements` (002), `orders.status` containing `completed` (003), `vendors.shop_cover_image`,
`guides.phone_public`, `site_settings`, `auth_attempts` (005), `local_foods` (006). Apply missing
files in the order listed above.

## Seed data

`seed.sql` was first generated from `src/data/mockData.ts` by `scripts/generate-seed.cjs`, but it has
been edited by hand since (settlements, Chattogram demo vendor `ctg@example.com` with 5 products,
product↔place links by district). **Don't regenerate it** with the script, or those additions are lost.

## Uploads

Files live in `heritagebd-data/uploads/{products,profiles,private}` inside the project (or
`HERITAGE_UPLOAD_DIR`). The database stores relative paths (`/api/product-images/<id>`); the frontend
adds `VITE_API_URL`. An older sibling folder (`../heritagebd-data/uploads`) is still read as a
fallback, but new files are written to the project folder only.

Also, for databases created before reset codes were hashed:
`ALTER TABLE password_resets MODIFY otp_code VARCHAR(255) NOT NULL;`

Track which files have been applied per environment manually, or add a `schema_migrations` table.
