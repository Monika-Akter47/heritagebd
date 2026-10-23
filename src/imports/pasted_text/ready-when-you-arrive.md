I want to add a major new feature to my existing HeritageBD UI/UX design called:

"READY WHEN YOU ARRIVE"

Tagline:
"Pre-order local food & heritage products before your visit. We'll have them ready when you arrive."

HeritageBD is a Bangladesh-focused Digital Heritage Tourism & Marketplace Platform connecting tourists, local vendors, tour guides, heritage destinations and cultural experiences.

I already have a complete HeritageBD system design. This new feature must integrate naturally into the existing platform rather than feeling like a separate application.

The attached HeritageBD system overview should be treated as the functional reference.

==================================================
1. FEATURE CONCEPT
==================================================

A tourist may plan to visit a particular heritage/tourist destination.

Instead of waiting at a local vendor when they arrive, the tourist can PRE-ORDER eligible local food, handicrafts, GI products and other traditional products before their visit.

Example:

Tourist plans to visit Sonargaon tomorrow at 2:00 PM.

They open HeritageBD.

They see:

"Products You Can Pre-Order Near Sonargaon"

- Traditional Pitha
- Nakshi Kantha
- Handmade Pottery
- Local Snacks
- Traditional Crafts

The tourist selects a product and chooses:

PRE-ORDER FOR PICKUP

Then selects:

Destination:
Sonargaon

Pickup date:
16 August 2026

Expected pickup time:
2:00 PM

Quantity:
2

The vendor receives the order and prepares the product before the tourist arrives.

The tourist pays 30% advance during booking.

The vendor prepares the order.

When the order is ready:

"Your order is ready for pickup."

The tourist arrives at the location.

The tourist shows a QR code/order code.

The vendor verifies the order.

The tourist pays the remaining 70%.

The product is handed over.

Order becomes:

COMPLETED

==================================================
2. IMPORTANT PAYMENT MODEL
==================================================

The pre-order requires:

30% ADVANCE PAYMENT

and

70% REMAINING PAYMENT AT PICKUP.

Example:

Product total:
৳1,000

Advance:
30% = ৳300

Remaining:
70% = ৳700

Show this calculation clearly throughout the UI.

Do NOT make the payment experience confusing.

At checkout display:

--------------------------------
Order Total          ৳1,000
Advance Payment 30%    ৳300
Pay Now                ৳300
Remaining at Pickup    ৳700
--------------------------------

Button:

"Pay ৳300 & Confirm Pre-Order"

After successful payment:

"Pre-order Confirmed"

Show:

Paid: ৳300
Remaining: ৳700

==================================================
3. TOURIST USER JOURNEY
==================================================

Design the complete end-to-end flow:

DISCOVER DESTINATION
↓
OPEN DESTINATION
↓
VIEW NEARBY PRODUCTS
↓
SELECT PRODUCT
↓
PRE-ORDER FOR PICKUP
↓
SELECT DATE & TIME
↓
SELECT QUANTITY
↓
CHECK AVAILABILITY
↓
VIEW 30% ADVANCE
↓
PAY 30%
↓
ORDER CONFIRMED
↓
VENDOR PREPARES
↓
ORDER READY
↓
TOURIST VISITS DESTINATION
↓
SHOW QR / PICKUP CODE
↓
VENDOR VERIFIES
↓
PAY REMAINING 70%
↓
RECEIVE PRODUCT
↓
ORDER COMPLETED
↓
RATE & REVIEW

Create screens for every important state.

==================================================
4. PRODUCT CARD
==================================================

Eligible products should have a special badge:

"READY WHEN YOU ARRIVE"

or

"PRE-ORDER AVAILABLE"

Product card should show:

Product image
Product name
Vendor
Location
Rating
Price
Preparation time
Pickup availability

Example:

Traditional Pitha
Sonargaon Food Corner

৳300

⭐ 4.8

🟢 Pre-order available

"Ready in approximately 2 hours"

Button:

"Pre-order"

==================================================
5. PRODUCT DETAILS
==================================================

Add a dedicated pre-order section to product details.

Example:

--------------------------------
TRADITIONAL PITHA

৳300
⭐ 4.8

📍 Sonargaon
🟢 Pre-order available

READY WHEN YOU ARRIVE

Order before your visit and we'll prepare
it for pickup when you arrive.

Preparation time:
Approximately 2 hours

Pickup location:
Sonargaon Traditional Market

--------------------------------

CTA:

"Pre-order for Pickup"

Also provide:

"Buy for Delivery"

if the product supports normal delivery.

This creates two purchasing modes:

1. Buy Now / Delivery
2. Pre-order / Pickup

==================================================
6. DESTINATION-BASED PRE-ORDER
==================================================

This is a major feature.

When a tourist opens a heritage destination:

Example:

SONARGAON

Show:

"Make Your Visit Easier"

"Pre-order local products before you arrive."

Then show:

Nearby food
Nearby handicrafts
Nearby GI products
Nearby vendors

Each item should show:

Distance
Pickup location
Preparation time
Price
Availability

CTA:

"Pre-order"

==================================================
7. MAP INTEGRATION
==================================================

Integrate this feature into the HeritageBD interactive map.

Map markers should include:

🏛 Heritage Place
🍛 Food
🛍 Vendor
🧑‍🏫 Tour Guide
🎭 Event

For vendors that support pre-ordering, show:

🟢 PRE-ORDER AVAILABLE

When the tourist clicks a vendor marker:

--------------------------------
Sonargaon Traditional Food Corner

⭐ 4.8
📍 0.8 km away

🟢 Pre-order available

Preparation:
30–60 minutes

[View Products]

[Pre-order]
--------------------------------

Also allow users to filter:

☑ Pre-order available

==================================================
8. TRIP PLANNER INTEGRATION
==================================================

Integrate pre-orders with the Trip Planner.

Example:

MY TRIP

Dhaka Heritage Weekend

DAY 1

2:00 PM
📍 Sonargaon

2:15 PM
🏛 Visit Heritage Site

3:30 PM
🛍 Pick up:
Traditional Pitha
Order #HB1024

4:00 PM
🏛 Folk Art Museum

This allows the tourist to see their:

DESTINATIONS + GUIDE + EVENTS + PRE-ORDERS

in one itinerary.

==================================================
9. PRE-ORDER CHECKOUT
==================================================

Create a dedicated checkout.

Step 1:
Pickup information

Step 2:
Order summary

Step 3:
Advance payment

Step 4:
Confirmation

Pickup information:

Destination
Vendor
Pickup location
Date
Time
Quantity

Order summary:

Product
Quantity
Subtotal
Preparation fee if applicable
Total

Payment:

Total:
৳1,000

30% Advance:
৳300

Remaining:
৳700

Payment methods:

bKash
Nagad
Card

Primary CTA:

"Pay ৳300 & Confirm Pre-Order"

==================================================
10. PAYMENT SUCCESS SCREEN
==================================================

Create a beautiful confirmation screen.

Icon:
✓

Heading:

"Pre-order Confirmed!"

Message:

"Your order will be prepared by the vendor and ready when you arrive."

Order:

#HB1024

Payment:

✓ Advance paid: ৳300

Remaining:

৳700

Pickup:

📍 Sonargaon Traditional Food Corner

📅 16 August 2026

🕑 2:00 PM

CTA:

"View Order"

Secondary:

"Add Pickup to My Trip"

==================================================
11. TOURIST ORDER TRACKING
==================================================

Create a special pre-order timeline:

PRE-ORDER CONFIRMED
↓
ADVANCE PAYMENT RECEIVED
↓
VENDOR ACCEPTED
↓
PREPARING
↓
READY FOR PICKUP
↓
ARRIVED AT LOCATION
↓
QR VERIFIED
↓
70% PAYMENT
↓
PICKED UP
↓
COMPLETED

Use different visual states.

Example:

✓ Confirmed

✓ Vendor accepted

🔄 Preparing

○ Ready for pickup

○ Pickup completed

==================================================
12. READY FOR PICKUP SCREEN
==================================================

When vendor marks the order ready:

Show:

🎉

"Your order is ready!"

Your order #HB1024 is ready for pickup.

Pickup location:
Sonargaon Traditional Food Corner

Pickup time:
2:00 PM

Remaining payment:
৳700

Button:

"Show Pickup QR"

Secondary:

"Get Directions"

==================================================
13. QR PICKUP SCREEN
==================================================

Create a dedicated QR code screen.

Display:

ORDER #HB1024

QR CODE

"Show this QR code to the vendor."

Below:

Pickup:
Sonargaon Traditional Food Corner

Date:
16 August

Time:
2:00 PM

Remaining payment:
৳700

Privacy/security note:

"Your order will be verified before pickup."

==================================================
14. VENDOR SIDE
==================================================

Create vendor dashboard screens for pre-orders.

Add a new sidebar item:

PRE-ORDERS

Dashboard:

Today's Pre-orders

Example:

#HB1024
Traditional Pitha
2 × ৳300

Pickup:
2:00 PM

Advance:
Paid ✓

Remaining:
৳600

Status:
Preparing

Actions:

Accept
Start Preparing
Mark Ready
View Order

==================================================
15. VENDOR PRE-ORDER DETAIL
==================================================

Show:

Order ID
Customer name
Product
Quantity
Pickup date
Pickup time
Pickup location
Advance paid
Remaining amount
Customer contact

Status controls:

CONFIRMED
↓
PREPARING
↓
READY
↓
PICKED UP
↓
COMPLETED

Primary action:

"Mark as Ready"

==================================================
16. VENDOR NOTIFICATION
==================================================

When a new pre-order arrives:

🔔 NEW PRE-ORDER

"New pickup order from a tourist visiting Sonargaon."

Product:
Traditional Pitha

Quantity:
2

Pickup:
2:00 PM

Advance:
৳180 paid

Button:

"View Order"

==================================================
17. PICKUP VERIFICATION
==================================================

Create a vendor-side QR scanner UI.

Heading:

"Scan Pickup QR"

After scanning:

✓ ORDER VERIFIED

Order #HB1024

Customer:
Monika

Product:
Traditional Pitha

Total:
৳600

Advance paid:
৳180

Remaining:
৳420

Button:

"Collect ৳420 & Complete Pickup"

==================================================
18. REMAINING PAYMENT
==================================================

At pickup show a clear payment screen.

--------------------------------
ORDER #HB1024

Total             ৳600
Advance Paid      ৳180
Remaining         ৳420
--------------------------------

Payment methods:

bKash
Nagad
Card
Cash

Primary:

"Pay ৳420 & Complete Pickup"

After successful payment:

✓ Payment Complete

✓ Order Picked Up

==================================================
19. PAYMENT HISTORY
==================================================

Tourist order details should show:

Payment Status:

✓ 30% Advance Paid
✓ 70% Pickup Payment Paid

Transaction history:

16 Aug
Advance Payment
৳180
Paid

16 Aug
Pickup Payment
৳420
Paid

Total:
৳600

==================================================
20. CANCELLATION / REFUND UI
==================================================

Design cancellation states.

If tourist cancels before vendor starts preparation:

Show:

"Cancellation requested"

and explain the applicable refund according to the platform's policy.

Do not assume a specific refund policy unless configured by admin.

Admin should be able to configure:

- Cancellation window
- Advance refund percentage
- Vendor preparation cutoff time

Create the UI for these settings.

==================================================
21. ADMIN MANAGEMENT
==================================================

Add:

PRE-ORDER MANAGEMENT

Admin can view:

Order ID
Tourist
Vendor
Destination
Pickup Date
Pickup Time
Amount
Advance
Remaining
Status

Filters:

Destination
Vendor
Date
Status
Payment status

Statuses:

Confirmed
Preparing
Ready
Picked Up
Completed
Cancelled
Refunded

==================================================
22. ADMIN PAYMENT SETTINGS
==================================================

Create settings for:

Advance payment percentage

Default:
30%

Admin should see:

"Advance payment percentage"

[ 30% ]

Allow admin to change this percentage in the future.

Also configure:

Payment methods
Cancellation rules
Refund rules
Pickup time limits
Preparation time rules

==================================================
23. NOTIFICATIONS
==================================================

Design notifications for:

Tourist:

"Pre-order confirmed."
"Vendor accepted your order."
"Your order is being prepared."
"Your order is ready for pickup."
"Your pickup time is approaching."
"Your remaining payment is ৳700."
"Order completed."

Vendor:

"New pre-order received."
"Pickup approaching."
"Customer has arrived."
"Payment completed."

==================================================
24. LOCATION + GUIDE INTEGRATION
==================================================

Connect this feature with the tour guide system.

Example trip:

Tourist hires a guide.

Guide dashboard shows:

Tourist's planned itinerary.

Tourist has:

2:00 PM — Sonargaon Heritage Visit
3:30 PM — Pre-order Pickup

The guide can help the tourist navigate to the pickup location.

On the tourist side:

"Your guide can help you reach your pickup location."

This should integrate naturally with the existing map and trip planner.

==================================================
25. MOBILE DESIGN
==================================================

Create mobile screens for the entire flow.

Mobile tourist flow:

Destination
↓
Nearby Products
↓
Product
↓
Pre-order
↓
Pickup Date/Time
↓
30% Payment
↓
Confirmation
↓
Tracking
↓
Ready
↓
QR Code
↓
Remaining Payment
↓
Completed

Use bottom navigation:

Home
Explore
Map
Guides
Profile

==================================================
26. EMPTY / ERROR / LOADING STATES
==================================================

Design:

No pre-order products nearby:

"No pre-order products available for this destination yet."

Vendor unavailable:

"This vendor is not accepting pre-orders right now."

Pickup time unavailable:

"Please select another pickup time."

Payment failed:

"Payment could not be completed."

Order cancelled:

"Your pre-order has been cancelled."

Use skeleton loaders while products/orders load.

==================================================
27. SPECIAL BADGES
==================================================

Create reusable badges:

🟢 Pre-order Available

🟠 Preparing

🔵 Ready for Pickup

✓ Verified Vendor

✓ Verified Guide

💳 30% Advance

📍 Pickup Nearby

==================================================
28. UX PRINCIPLE
==================================================

The feature must communicate one simple promise:

"Order before you go. Pick up when you arrive."

The tourist should understand:

WHAT
WHERE
WHEN
HOW MUCH NOW
HOW MUCH LATER

at every stage.

Never hide the remaining 70% payment.

==================================================
29. IMPORTANT BUSINESS LOGIC TO VISUALIZE
==================================================

The Figma prototype should clearly demonstrate:

Tourist places order
↓
Pays 30% advance
↓
Vendor receives order
↓
Vendor accepts
↓
Vendor prepares
↓
Vendor marks ready
↓
Tourist gets notification
↓
Tourist arrives
↓
QR code verified
↓
Tourist pays remaining 70%
↓
Vendor hands over product
↓
Order completed
↓
Tourist reviews vendor/product

==================================================
30. FINAL FIGMA PROTOTYPE
==================================================

Create clickable prototype connections for:

Destination
→ Nearby Products
→ Product Details
→ Pre-order
→ Pickup Date/Time
→ Checkout
→ 30% Advance Payment
→ Confirmation
→ Order Tracking
→ Ready for Pickup
→ QR Code
→ Remaining 70% Payment
→ Order Complete
→ Review

Also connect:

Map
→ Vendor
→ Pre-order

Trip Planner
→ Pre-order

Vendor Dashboard
→ New Pre-order
→ Prepare
→ Ready
→ QR Verification
→ Complete

Admin Dashboard
→ Pre-order Management
→ Payment Settings
→ Cancellation/Refund Settings

==================================================
31. DESIGN QUALITY
==================================================

Make this feature visually consistent with the existing HeritageBD design.

Use:

- High-quality imagery
- Clean cards
- Clear hierarchy
- Modern typography
- Rounded UI
- Subtle shadows
- Elegant Bangladesh-inspired visual identity
- Strong CTA buttons
- Clear payment information
- Excellent mobile UX

Do not make this look like a generic e-commerce checkout.

It should feel like a unique tourism feature.

The final concept should communicate:

DISCOVER
→ PLAN
→ PRE-ORDER
→ PAY 30%
→ TRAVEL
→ PICK UP
→ PAY 70%
→ EXPERIENCE