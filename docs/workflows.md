# Business workflows

All transitions are enforced server-side in the controllers. A disallowed step returns 422
(or 403 for the wrong role).

## Marketplace orders

Source: `backend/controllers/orders_controller.php`.

State diagram: [diagrams.md §9](diagrams.md#9-order-states) · sequence: [§7](diagrams.md#7-marketplace-order-and-settlement).

- Checkout (`POST /orders`) rebuilds totals from DB prices, splits the cart into **one order per
  vendor**, adds ৳120 delivery per order, reserves stock in a transaction and holds a 20% advance.
- Vendor moves the order forward one step at a time; `confirmed` requires an estimated delivery date.
- Cancellation is only possible before `preparing`; reserved stock is restored.
- `delivered` (vendor) does **not** release money. The tourist confirms receipt from Order Tracking,
  which moves it to `completed` and runs `settle_order()`.

## Pre-orders (Ready When You Arrive)

Source: `backend/controllers/preorders_controller.php` (`PREORDER_TRANSITIONS`,
`PREORDER_TRANSITION_ROLES`).

State diagram: [diagrams.md §10](diagrams.md#10-pre-order-states). Any state before `picked_up` can
be cancelled. `refunded` is defined but currently unreachable (see known issues).

| Step into | Who | Extra rule |
|---|---|---|
| `vendor_accepted`, `preparing`, `ready_for_pickup` | vendor, admin | |
| `arrived` | tourist, vendor, admin | Tourist taps "I've arrived", or the vendor marks it at the counter |
| `qr_verified` | vendor, admin | Vendor enters the order number and the tourist's 8-character pickup code (last 8 letters/digits of `qrCode`; case, spaces and dashes ignored) or the full QR text. Allowed from `ready_for_pickup` (marked `arrived` first) or `arrived`; there is no camera scanner |
| `pickup_payment_pending` | vendor, admin | |
| `picked_up` | vendor, admin | Needs `pickupPaymentMethod` (`bkash`/`nagad`/`card`/`cash`); zeroes `remaining_amount` |
| `completed` | vendor, admin | Runs `settle_preorder()` |
| `cancelled` | tourist, vendor, admin | Needs a `cancellationReason` |
| `refunded` | admin | |

Tourist pays 30% online up front and 70% at pickup. Tourists can only set `arrived` or `cancelled`.

Refunds: a tourist's own cancellation refunds the configured share at once (`advance_status = refunded`).
When the vendor or an admin cancels a paid pre-order, the advance becomes `refund_pending`, admins are
notified, and an admin records the refund (`POST /admin/refunds/preorder/{id}` with `method` and
`transactionId`, from **Admin → Payments**); the order then becomes `refunded`. Guide bookings work the
same way when the guide cancels or rejects (`POST /admin/refunds/guide_booking/{id}`).

The vendor's list is ordered by pickup date, soonest first, with closed orders last.

## Guide bookings

Source: `backend/controllers/bookings_controller.php`.

State diagram: [diagrams.md §11](diagrams.md#11-guide-booking-states) · sequence: [§8](diagrams.md#8-guide-booking-and-settlement).

| Actor | Allowed |
|---|---|
| Guide | `pending → accepted / rejected`; `accepted → awaiting_confirmation` (after the tour's end date) / `cancelled` |
| Tourist | `pending / accepted → cancelled`; `awaiting_confirmation → completed` (confirms the tour happened and the cash balance was paid) |
| Admin | Any defined transition, plus forcing `completed` / `rejected` / `cancelled` |

Only the tourist's confirmation (or an admin) releases the held 20% advance via `settle_booking()`.
`POST /bookings` rejects dates that overlap the guide's pending/accepted bookings.

## Trip plans

Tourists create plans with days and stops (`trip_plans`, `trip_days`, `trip_stops`). A plan may be
shared with a verified guide, who sets `guide_response` to `accepted` or `declined`. Either party can
mark an accepted plan completed after it ends.

## Local foods and products by area

Sequence diagram: [diagrams.md §12](diagrams.md#12-local-foods-and-products-by-area).

- `helpers/areas.php` knows all 8 divisions and 64 districts, plus alternate spellings and landmarks
  (Chittagong → Chattogram, Comilla → Cumilla, Sreemangal → Moulvibazar, Paharpur → Naogaon, and so on).
  `resolve_area()` turns free text such as a destination name into a district or division.
- A **division** returns everything in it. A **district** returns its own items first (`areaMatch: local`)
  topped up with the rest of its division (`areaMatch: nearby`). Pass `exact=1` to get only the district.
- Because every division shares its name with a district, `scope=district` makes "Dhaka" mean Dhaka
  district (place pages, trip planner); without it, "Dhaka" means the whole division (shop chips).
- Products match on the product's district, its pickup point, a linked heritage place
  (`product_near_destinations`) or the vendor's address. Foods match on their stored district/division.
- Where it appears: the trip planner result, the place page Overview (and its Pre-Order tab is now
  area-filtered), and the shop (`?area=` with division chips and a district dropdown).
- Admins manage foods in **Admin → Traditional Foods** (add, feature, photo, delete).

## Verification and onboarding

1. Vendor/guide registers → `users.status = pending`, profile `verification_status = pending`.
2. Completes onboarding (`/onboarding/vendor|guide`) and uploads documents (`POST /documents`).
   Submitting the profile sends every admin a "Guide/Vendor verification request" notification.
3. Admin reviews documents in **Admin → Verification Center** and calls `/admin/vendors|guides/{id}/verify`.
4. Only verified, active partners appear publicly or receive orders/bookings.

## Payments

`helpers/payments.php` → `collect_advance()` returns `true` whenever `PAYMENTS_DEMO_MODE` is on. No
bKash, Nagad or card gateway is integrated. To go live: implement a real charge, store the gateway
transaction ID, handle failures and refunds, then set `PAYMENTS_DEMO_MODE = false`.

## Settlement maths

`helpers/earnings.php` → `compute_split(grossPoisha, advPct, commPct)`:

```
advance     = round(gross × advPct / 100)
commission  = round(gross × commPct / 100)
released    = advance − commission      (paid to partner from the held advance)
cash        = gross − advance           (collected by partner directly)
partnerTotal = released + cash
```

Example, ৳1,000 order at 20% / 10%: advance ৳200, commission ৳100, released ৳100, cash ৳800, partner
total ৳900.

For multi-vendor data, `settle_order()` allocates the delivery fee across vendors in proportion to
their line totals (remainder to the last vendor). Each settle function only acts when
`advance_status = 'held'` and flips it to `released`, which prevents double settlement.
