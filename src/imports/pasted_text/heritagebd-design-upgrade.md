I already have an existing Figma frontend design for a project called HERITAGEBD.

DO NOT CREATE A COMPLETELY DIFFERENT PROJECT.

Instead, analyze my existing HeritageBD design and REWORK, CORRECT, CONNECT, and UPGRADE it into one consistent, complete, professional frontend system.

The goal is to make the entire Figma prototype functional, logically connected, visually consistent, and ready for future backend/database integration.

============================================================
PROJECT NAME
============================================================

HERITAGEBD

A Bangladesh-focused Digital Heritage Tourism, Local Marketplace,
Tour Guide and Cultural Experience Platform.

HeritageBD connects:

Tourists
Tour Guides
Local Vendors
Heritage Places
Traditional Food
Handicrafts
GI Products
Cultural Events
Heritage Stories

The platform combines:

Tourism discovery
Interactive map
Tour guide discovery
Guide location
Trip planning
Route optimization
Local marketplace
Seasonal products
Promotional products
Pre-order & pickup
30% advance payment
70% pickup payment
Reviews
Events
Admin management

============================================================
IMPORTANT: FIX EXISTING DESIGN
============================================================

Do not blindly create new pages.

First inspect the existing HeritageBD design.

Identify:

- inconsistent navigation
- broken login flow
- mixed user roles
- missing pages
- duplicated pages
- inconsistent buttons
- disconnected prototype links
- missing states
- unclear user journeys
- inconsistent typography
- inconsistent components
- inconsistent cards
- inconsistent dashboards

Then redesign and connect them properly.

Maintain the strongest parts of the existing design while improving the weak parts.

The final design must feel like ONE PLATFORM.

============================================================
1. CRITICAL FIX — LOGIN / SIGN UP SYSTEM
============================================================

The existing login/sign-in design has a serious problem:

ADMIN
TOUR GUIDE
VENDOR
TOURIST

accounts are getting mixed up.

FIX THIS COMPLETELY.

Each role must have a clear authentication and authorization flow.

Create:

LOGIN
SIGN UP
FORGOT PASSWORD
OTP VERIFICATION
ROLE SELECTION
PROFILE SETUP
ACCOUNT VERIFICATION
ROLE-BASED DASHBOARD

============================================================
2. ROLE-BASED LOGIN
============================================================

Do NOT create one confusing dashboard after login.

The system must identify the user's role and redirect correctly.

Example:

TOURIST LOGIN
↓
Authentication
↓
Tourist Dashboard

VENDOR LOGIN
↓
Authentication
↓
Vendor Dashboard

TOUR GUIDE LOGIN
↓
Authentication
↓
Guide Dashboard

ADMIN LOGIN
↓
Authentication
↓
Admin Dashboard

Clearly differentiate the UI of each role.

============================================================
3. ADMIN LOGIN
============================================================

Create a dedicated Admin Login interface.

Admin login should NOT accidentally redirect to:

Tourist Dashboard
Vendor Dashboard
Guide Dashboard

Admin should go only to:

/admin/dashboard

Admin interface should have:

Admin branding
Admin login
Security indication
Email/username
Password
Forgot password
2FA/OTP if required
Login error states
Session expired state

After successful login:

→ Admin Dashboard

============================================================
4. TOUR GUIDE LOGIN
============================================================

Guide login should redirect only to:

/guide/dashboard

Guide dashboard includes:

Dashboard
Bookings
Tour Planner
Calendar
Messages
Earnings
Reviews
Availability
Location
Profile
Verification

If guide verification is pending:

Show:

"Your guide verification is under review."

Do not show:

"Verified Guide"

until admin approves the application.

============================================================
5. VENDOR LOGIN
============================================================

Vendor login should redirect only to:

/vendor/dashboard

Vendor dashboard:

Dashboard
Products
Orders
Pre-orders
Inventory
Customers
Reviews
Earnings
Settings

If vendor verification is pending:

Show:

"Your vendor account is awaiting verification."

============================================================
6. TOURIST LOGIN
============================================================

Tourist login redirects only to:

/dashboard

Tourist features:

Explore
Map
Guides
Trip Planner
Orders
Ready to Pick
Favorites
Reviews
Messages
Notifications
Profile

============================================================
7. SIGN UP
============================================================

Create a clean role selection screen:

"How will you use HeritageBD?"

Cards:

🧳 Tourist

Explore Bangladesh
Plan trips
Find guides
Pre-order local products

🧑‍🏫 Tour Guide

Offer tours
Create tour plans
Connect with tourists

🏪 Vendor

Sell local products
Receive pre-orders
Manage shop

Admin accounts should NOT be publicly selectable during normal registration.

Admin accounts are created/managed separately.

============================================================
8. AUTHENTICATION STATES
============================================================

Design all states:

Normal
Loading
Invalid email
Invalid password
Account not found
Account not verified
Account suspended
Too many attempts
Network error
Session expired
Successful login

Use clear messages.

Example:

"Incorrect email or password."

"Your account is awaiting verification."

"Your account has been suspended. Please contact support."

============================================================
9. SIGN UP + OTP
============================================================

Flow:

Sign Up
↓
Role Selection
↓
Registration Form
↓
Email/Phone Verification
↓
OTP
↓
Verified
↓
Profile Setup
↓
Dashboard / Verification

OTP states:

Correct
Incorrect
Expired
Resend
Too many attempts

============================================================
10. DATABASE-READY UI
============================================================

The frontend will later connect to a real database.

Design the UI assuming that data will be stored for:

Users
Roles
Profiles
Guides
Vendors
Products
Orders
Pre-orders
Payments
Bookings
Trips
Routes
Locations
Reviews
Events
Stories
Notifications
Verification documents

Every page should have:

Loading state
Empty state
Error state
Success state

Do NOT use random disconnected mock screens.

============================================================
11. HOME DASHBOARD — IMPORTANT CORRECTION
============================================================

Redesign the tourist dashboard/home page.

The top section must prioritize:

PROMOTIONAL / OFFER PRODUCTS

Section heading:

"Today's Offers"

or

"Special Offers"

Show promotional products at the TOP of the dashboard.

Example:

🔥 LIMITED TIME OFFER

Nakshi Kantha

৳1,500
~~৳2,000~~

25% OFF

⭐ 4.8

[View Offer]

[Ready to Pick]

Use visually attractive promotional cards.

Show:

Original price
Discounted price
Discount percentage
Offer end date/time
Vendor
Location

Do not hide offers below multiple unrelated sections.

============================================================
12. SEASONAL PRODUCTS
============================================================

Add a dedicated:

"Seasonal Picks"

section to the dashboard.

Examples:

Winter:

Pitha
Date molasses
Warm traditional clothing

Eid:

Panjabi
Saree
Traditional sweets
Gift items

Pohela Boishakh:

Traditional clothing
Handicrafts
Decorative items

Rainy season:

Local snacks
Traditional umbrellas/crafts

Seasonal product cards should show:

Product
Image
Price
Season
Vendor
Location
Availability
Rating

CTA:

"Explore Seasonal Products"

============================================================
13. PRODUCT PRICE DIFFERENTIATION
============================================================

Users should be able to easily distinguish products by price.

Create:

Price categories:

Under ৳500
৳500–৳1,000
৳1,000–৳2,500
৳2,500+

Also create:

Price filter
Sort by low → high
Sort by high → low

Product cards should clearly show:

Current price
Original price if discounted
Discount
Price category

Example:

৳750

~~৳1,000~~

25% OFF

============================================================
14. PRODUCT CATEGORIES
============================================================

Create clear categories:

GI Products
Handicrafts
Traditional Food
Clothing
Souvenirs
Home & Decor
Local Specialties
Seasonal Products

============================================================
15. "READY TO PICK" — RENAME EVERYWHERE
============================================================

IMPORTANT:

Completely remove the previous phrase:

"Ready When You Arrive"

Replace it everywhere with:

"READY TO PICK"

Do not leave the old wording anywhere.

Use:

🟢 READY TO PICK

Feature meaning:

Tourists can order a product before visiting a destination.

The vendor prepares the product.

Tourist arrives.

Tourist picks up the order.

============================================================
16. READY TO PICK USER JOURNEY
============================================================

The complete flow must be:

Discover Destination
↓
View Nearby Products
↓
Select Product
↓
Ready to Pick
↓
Select Pickup Date
↓
Select Pickup Time
↓
Confirm Quantity
↓
30% Advance Payment
↓
Order Confirmed
↓
Vendor Accepts
↓
Vendor Prepares
↓
Ready to Pick
↓
Tourist Notification
↓
Tourist Arrives
↓
Show QR Code
↓
Vendor Verifies
↓
70% Remaining Payment
↓
Pickup Completed
↓
Review

============================================================
17. READY TO PICK PRODUCT CARD
============================================================

Product card:

Product image
Product name
Vendor
Location
Rating
Price
Preparation time

Badge:

🟢 READY TO PICK

Example:

Traditional Pitha

৳300

⭐ 4.8

📍 Sonargaon

⏱ Preparation: 1 hour

🟢 Ready to Pick

CTA:

"Pre-order"

============================================================
18. READY TO PICK CHECKOUT
============================================================

Show:

Product
Quantity
Pickup destination
Vendor
Pickup date
Pickup time

Payment:

Order Total       ৳1,000

30% Advance        ৳300

Pay Now             ৳300

Remaining at Pickup ৳700

Primary button:

"Pay ৳300 & Confirm Order"

Never hide the remaining 70%.

============================================================
19. READY TO PICK ORDER STATUS
============================================================

Create visual timeline:

✓ Order Confirmed
✓ 30% Advance Paid
✓ Vendor Accepted
🔄 Preparing
○ Ready to Pick
○ Tourist Arrived
○ QR Verified
○ 70% Paid
○ Picked Up
○ Completed

============================================================
20. QR PICKUP
============================================================

Create:

"Ready to Pick"

Order #HB1024

QR CODE

"Show this code to the vendor."

Show:

Pickup location
Pickup date
Pickup time

Payment:

Advance Paid: ৳300

Remaining: ৳700

============================================================
21. VENDOR READY TO PICK SYSTEM
============================================================

Vendor dashboard must contain:

Dashboard
Products
Orders
READY TO PICK
Inventory
Customers
Reviews
Earnings
Settings

Ready to Pick page:

New Orders
Preparing
Ready
Picked Up
Completed

Vendor actions:

Accept
Start Preparing
Mark Ready
Verify QR
Complete Pickup

============================================================
22. TOUR GUIDE — NEW TOUR PLANNER PAGE
============================================================

Create a completely new major page:

"TOUR PLANNER"

This page is for TOUR GUIDES.

The guide can create different tour plans based on their current location.

============================================================
23. GUIDE CURRENT LOCATION
============================================================

At the top:

📍 Current Location

Example:

"Currently near: Dhaka"

Button:

"Use My Current Location"

The guide can also manually select:

City
District
Tourist destination

============================================================
24. SMART ROUTE PLANNER
============================================================

The guide enters:

Starting location

Then selects multiple tourist destinations.

Example:

Start:
Dhaka

Stops:

Lalbagh Fort
Ahsan Manzil
Sadarghat
Sonargaon

The system visually calculates:

Best Route
Shortest Distance
Estimated Travel Time
Estimated Travel Cost

Show route on map.

============================================================
25. LOW-COST TOUR ROUTE
============================================================

The guide wants:

BEST EXPERIENCE + LESS COST

Therefore show route options:

Recommended
Shortest
Lowest Cost
Fastest

Example:

Recommended Route

Distance:
48 km

Estimated time:
5h 20m

Estimated transport cost:
৳600

Button:

"Use This Route"

============================================================
26. DIFFERENT TOUR PLANS
============================================================

Allow guides to create multiple saved plans.

Examples:

"Dhaka Heritage Half Day"

"Old Dhaka Food Tour"

"Sonargaon Full Day"

"Chittagong Heritage Tour"

"Sylhet Nature & Culture Tour"

Each plan should store:

Plan name
Starting point
Stops
Distance
Estimated duration
Estimated cost
Transport type
Notes

Actions:

View
Edit
Duplicate
Delete
Share

============================================================
27. TOUR ROUTE MAP
============================================================

Create a large interactive map.

Show:

Start point
Numbered destinations
Route line
Distance
Estimated travel time

Example:

START
📍

1 → Lalbagh Fort
↓
2 → Ahsan Manzil
↓
3 → Sadarghat
↓
4 → Sonargaon

Show:

Total Distance
Total Time
Estimated Cost

============================================================
28. TRANSPORT OPTIONS
============================================================

Allow guides to select:

Walking
Rickshaw
CNG
Bus
Car
Ride sharing

Show estimated cost for each.

Example:

CNG
৳300–400

Ride Share
৳500–650

Bus
৳100–150

The guide can choose:

"Lowest Cost"

or

"Fastest"

============================================================
29. MID-TOUR PLAN CHANGE
============================================================

This is an important feature.

A guide may need to change the route during a tour.

Create:

"Modify Tour"

Button.

When clicked:

Current Tour

↓
Current Location

↓
Existing Stops

Allow:

Add destination
Remove destination
Reorder destinations
Skip destination
Change pickup/drop-off
Change transport

Then recalculate:

New route
New distance
New duration
New estimated cost

Show comparison:

Previous Route
vs
Updated Route

Example:

Previous:

42 km
5h 10m
৳550

Updated:

35 km
4h 35m
৳470

Message:

"Updated route saves approximately ৳80 and 35 minutes."

Button:

"Apply New Route"

============================================================
30. TOURIST NOTIFICATION FOR PLAN CHANGE
============================================================

If a guide changes a shared tour plan:

Tourist receives:

"Your guide updated today's tour plan."

Show:

Removed:
Sadarghat

Added:
Sonargaon Folk Art Museum

Updated arrival time:
3:40 PM

Updated estimated cost:
৳470

Buttons:

"View Updated Plan"

"Accept"

============================================================
31. TOUR PLAN SHARING
============================================================

Guide can share a tour plan with tourists.

Button:

"Share Tour Plan"

Tourist receives:

Tour name
Destinations
Route
Estimated time
Estimated cost
Guide information

============================================================
32. GUIDE DASHBOARD
============================================================

Redesign guide dashboard.

Top:

Good morning, [Guide Name]

Status:

🟢 Available for Tour

Cards:

Today's Tours
Upcoming Bookings
Total Earnings
Rating

Quick actions:

Create Tour Plan
View Bookings
Start Tour
Modify Route
Manage Availability

Also show:

Today's Tour Route

============================================================
33. GUIDE START TOUR MODE
============================================================

When a guide starts a tour:

"Start Tour"

Show:

Current Location
Next Destination
Distance
ETA
Route

Button:

"Start Navigation"

Then:

"Modify Tour"

"End Tour"

============================================================
34. TOURIST MAP INTEGRATION
============================================================

Tourists should be able to see:

Heritage Places
Food
Vendors
Ready to Pick products
Available Guides
Events

Map filters:

Heritage
Food
Products
Guides
Events
Ready to Pick

============================================================
35. GUIDE LOCATION PRIVACY
============================================================

Do NOT permanently expose exact guide location.

Guide controls:

Available for Tour
ON/OFF

Share Location
ON/OFF

When enabled:

"Nearby tourists can discover your approximate location while you are available for tours."

When disabled:

"Your location is hidden."

============================================================
36. GUIDE VERIFICATION
============================================================

Fix the verification system properly.

Guide registration:

Personal Information
↓
Professional Information
↓
Documents
↓
Tour Areas
↓
Availability
↓
Location Permission
↓
Submit

Status:

Draft
Pending
Approved
Rejected
More Information Required

Only after ADMIN APPROVES:

✓ VERIFIED GUIDE

appears.

============================================================
37. VENDOR VERIFICATION
============================================================

Vendor:

Registration
↓
Business Information
↓
Documents
↓
Shop Information
↓
Submit
↓
Admin Review
↓
Approved / Rejected

Only approved vendors get:

✓ VERIFIED VENDOR

============================================================
38. ADMIN VERIFICATION CENTER
============================================================

Admin sidebar:

Dashboard
Users
Vendors
Tour Guides
Verification
Places
Products
Orders
Ready to Pick
Bookings
Events
Stories
Reviews
Reports
Settings

Verification tabs:

All
Pending
Approved
Rejected

Filters:

Role
Location
Date
Status

============================================================
39. ADMIN GUIDE REVIEW
============================================================

Admin sees:

Guide profile
Photo
Name
Email
Phone
Experience
Languages
Specialization
Tour areas
Documents
Application date

Actions:

✓ Approve
✕ Reject
↩ Request More Information

If rejecting:

Show reason field.

============================================================
40. ADMIN VENDOR REVIEW
============================================================

Same structure for vendors.

Business information
Shop
Documents
Address
Products

Actions:

Approve
Reject
Request More Information

============================================================
41. ADMIN DASHBOARD
============================================================

Top cards:

Total Users
Total Guides
Total Vendors
Total Products
Total Orders
Ready to Pick Orders
Pending Verifications
Total Revenue

Charts:

User growth
Orders
Revenue
Guide bookings
Popular destinations
Popular products

============================================================
42. TOURIST DASHBOARD FINAL STRUCTURE
============================================================

Dashboard should prioritize:

1. Promotional / Offer Products

2. Seasonal Products

3. Popular Destinations

4. Available Tour Guides

5. Recommended Experiences

6. Ready to Pick Products

7. Upcoming Events

8. Heritage Stories

9. Personalized Trip Suggestions

============================================================
43. OFFER / PROMOTIONAL SECTION
============================================================

At the TOP:

"🔥 Today's Offers"

Cards should have:

Discount
Original price
Current price
Countdown/end date
Vendor
Rating

Example:

25% OFF

Nakshi Kantha

৳1,500
~~৳2,000~~

"Offer ends tonight"

[Shop Now]

============================================================
44. SEASONAL SECTION
============================================================

Section:

"🌿 Seasonal Picks"

Add:

"Based on the current season"

Show relevant products.

Allow:

View All Seasonal Products

============================================================
45. PRICE FILTERING
============================================================

Product marketplace filters:

Category
Price
Rating
Location
Availability
Season
Offer
Ready to Pick

Price slider:

৳0 → ৳10,000+

Price ranges:

Under ৳500
৳500–৳1,000
৳1,000–৳2,500
Above ৳2,500

Sort:

Price Low → High
Price High → Low
Popular
Highest Rated
Newest
Best Offer

============================================================
46. PRODUCT DETAILS
============================================================

Show:

Images
Product name
Vendor
Verified Vendor
Rating
Original price
Discounted price
Discount
Description
Origin
Cultural significance
GI badge
Seasonal badge
Ready to Pick badge
Availability
Preparation time
Pickup location

Purchase options:

"Buy for Delivery"

"Ready to Pick"

============================================================
47. TRIP PLANNER — TOURIST
============================================================

Tourists can create:

My Trips

Example:

Dhaka Heritage Weekend

Day 1

Lalbagh Fort
Ahsan Manzil
Food Tour
Ready to Pick order

Day 2

Sonargaon
Folk Art Museum
Handicraft Pickup

Show:

Route
Guide
Events
Pre-orders
Estimated time

============================================================
48. NOTIFICATIONS
============================================================

Create notifications for:

Offer available
Seasonal products
Order confirmed
Ready to Pick order ready
Pickup reminder
Guide booking
Guide route change
Verification status
Payment
Review
Event reminder

============================================================
49. MOBILE DESIGN
============================================================

Everything must work beautifully on mobile.

Tourist bottom navigation:

Home
Explore
Map
Guides
Profile

Guide bottom navigation:

Dashboard
Tours
Map
Messages
Profile

Vendor bottom navigation:

Dashboard
Products
Orders
Ready to Pick
Profile

============================================================
50. DESIGN SYSTEM
============================================================

Create ONE consistent HeritageBD design system.

Components:

Buttons
Inputs
Cards
Product cards
Guide cards
Vendor cards
Map markers
Badges
Tables
Modals
Toasts
Tabs
Dropdowns
Filters
Status indicators
Timeline
QR cards
Payment cards

States:

Default
Hover
Active
Disabled
Loading
Success
Error

============================================================
51. IMPORTANT PROTOTYPE RULE
============================================================

Make the Figma prototype actually navigable.

Every important CTA should lead somewhere meaningful.

Examples:

Login
→ Correct role dashboard

Sign Up
→ OTP

OTP
→ Profile

Guide verification
→ Pending

Admin approval
→ Verified Guide

Product
→ Product Details

Ready to Pick
→ Pickup checkout

30% Payment
→ Order confirmation

Vendor
→ Pre-order management

Mark Ready
→ Tourist notification

QR
→ Pickup verification

70% payment
→ Completed

Tour Planner
→ Route

Modify Tour
→ Updated Route

============================================================
52. FINAL USER JOURNEYS
============================================================

TOURIST:

Login
↓
Dashboard
↓
Today's Offers / Seasonal Products
↓
Explore
↓
Map
↓
Destination
↓
Guide
↓
Trip Planner
↓
Ready to Pick
↓
30% Payment
↓
Travel
↓
Pickup
↓
70% Payment
↓
Review

TOUR GUIDE:

Login
↓
Guide Dashboard
↓
Availability
↓
Current Location
↓
Tour Planner
↓
Create Route
↓
Choose Lowest Cost / Fastest / Recommended
↓
Save Tour Plan
↓
Share With Tourist
↓
Start Tour
↓
Mid-tour Modify Route
↓
Recalculate
↓
Apply New Route
↓
Complete Tour

VENDOR:

Login
↓
Vendor Dashboard
↓
Add Product
↓
Manage Offer
↓
Manage Seasonal Product
↓
Receive Ready to Pick Order
↓
Accept
↓
Prepare
↓
Mark Ready
↓
QR Verification
↓
Receive 70% Payment
↓
Complete Order

ADMIN:

Admin Login
↓
Admin Dashboard
↓
Verification
↓
Review Guide/Vendor
↓
Approve/Reject
↓
Manage Users
↓
Manage Products
↓
Manage Offers
↓
Manage Seasonal Products
↓
Manage Ready to Pick
↓
Manage Orders
↓
Manage Reports

============================================================
53. FINAL QUALITY REQUIREMENT
============================================================

The final Figma design must NOT feel like several separate projects combined together.

It must feel like one complete ecosystem:

DISCOVER
↓
EXPLORE
↓
FIND GUIDE
↓
PLAN TOUR
↓
OPTIMIZE ROUTE
↓
BOOK / EXPERIENCE
↓
READY TO PICK
↓
PAY 30%
↓
TRAVEL
↓
PICK UP
↓
PAY 70%
↓
REVIEW
↓
DISCOVER AGAIN

Make HeritageBD feel like a real commercial product rather than a university prototype.

Prioritize:

1. Correct role-based authentication
2. Professional admin verification
3. Tourist dashboard
4. Promotional products at the top
5. Seasonal products
6. Price differentiation/filtering
7. Ready to Pick system
8. 30% advance + 70% pickup payment
9. Tour guide route planner
10. Low-cost route optimization
11. Multiple tour plans
12. Mid-tour route modification
13. Map integration
14. Vendor workflow
15. Admin management
16. Responsive mobile design

MOST IMPORTANT:

FIX THE EXISTING LOGIN/SIGN-IN ROLE MIXING PROBLEM FIRST.

A TOURIST MUST NEVER BE SENT TO THE VENDOR/GUIDE/ADMIN DASHBOARD.

A VENDOR MUST NEVER BE SENT TO THE GUIDE/TOURIST DASHBOARD.

A TOUR GUIDE MUST NEVER BE SENT TO THE ADMIN DASHBOARD.

AN ADMIN MUST NEVER BE SENT TO A NORMAL USER DASHBOARD.

Use clear role-based prototype paths and labels throughout the Figma file.

Also make sure the old phrase "Ready When You Arrive" is completely removed and replaced with "Ready to Pick" everywhere.