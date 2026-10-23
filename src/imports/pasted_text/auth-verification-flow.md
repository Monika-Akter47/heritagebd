I am building a complete web platform called HERITAGEBD.

HeritageBD is a Bangladesh-focused Digital Heritage Tourism & Marketplace Platform connecting:

Tourists
Local Users
Vendors
Tour Guides
Heritage Places
Cultural Events
Traditional Products

The existing HeritageBD design already contains:

- Tourism discovery
- Heritage places
- Interactive map
- Tour guides
- Live/available guide location
- Trip planner
- Marketplace
- Traditional food
- GI products
- Handicrafts
- Pre-order / pickup system
- 30% advance payment
- 70% payment at pickup
- Reviews
- Events
- Heritage stories
- Vendor dashboard
- Guide dashboard
- Admin dashboard

Now I want to properly design the COMPLETE AUTHENTICATION, USER ACCOUNT, DATABASE-RELATED UI STATES, AND VERIFICATION SYSTEM.

IMPORTANT:

Figma is only responsible for the UI/UX and prototype.

Do NOT try to create an actual database.

Instead, design the complete interface and user flows so that a developer can later connect the design to a real backend database and authentication system.

The design should clearly communicate which information is stored, verified, pending, rejected, approved, active, suspended, etc.

==================================================
1. USER ROLES
==================================================

HeritageBD has four main roles:

1. TOURIST
2. VENDOR
3. TOUR GUIDE
4. ADMIN

Each role must have appropriate permissions and dashboards.

A user should NOT automatically get access to another role's dashboard.

==================================================
2. AUTHENTICATION ARCHITECTURE
==================================================

Design the complete authentication journey:

Landing Page
↓
Sign Up / Login
↓
Choose Account Type
↓
Create Account
↓
Email / Phone Verification
↓
OTP Verification
↓
Account Created
↓
Profile Setup
↓
Dashboard

Login flow:

Login
↓
Enter Email / Phone
↓
Password
↓
Authentication
↓
Successful Login
↓
Role-based Dashboard

If authentication fails:

Show appropriate error state.

==================================================
3. SIGN UP PAGE
==================================================

Create a beautiful modern registration screen.

Heading:

"Create your HeritageBD account"

Fields:

Full Name
Email Address
Phone Number
Password
Confirm Password

Optional:

Profile Photo

Account Type:

○ Tourist
○ Vendor
○ Tour Guide

Terms:

☐ I agree to the Terms & Conditions and Privacy Policy.

Primary CTA:

"Create Account"

Secondary:

"Already have an account? Log in"

Use proper validation states.

==================================================
4. SIGNUP VALIDATION
==================================================

Design validation states for:

Empty field

Invalid email

Invalid phone

Weak password

Password mismatch

Existing email

Existing phone

Terms not accepted

Successful registration

Example:

Email:

✓ monika@example.com

Password:

Strong password
██████████

Confirm password:

✓ Passwords match

Use clear and accessible error messages.

==================================================
5. OTP VERIFICATION
==================================================

After registration:

Create:

"Verify your account"

Message:

"We sent a verification code to your phone/email."

OTP:

[ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]

Buttons:

"Verify"

"Resend Code"

"Change Email / Phone"

Timer:

Resend available in 00:45

States:

Correct OTP
Incorrect OTP
Expired OTP
Too many attempts
OTP resent
Verification successful

Success screen:

✓ Account verified

"Your HeritageBD account is now verified."

CTA:

"Continue"

==================================================
6. LOGIN PAGE
==================================================

Create a polished login page.

Heading:

"Welcome back to HeritageBD"

Fields:

Email / Phone
Password

Options:

☐ Remember me

Forgot password?

CTA:

"Log In"

Alternative:

"Continue with Google"

Below:

"Don't have an account? Create one"

==================================================
7. LOGIN ERROR STATES
==================================================

Design:

Incorrect password

Account not found

Account not verified

Account suspended

Too many login attempts

Server error

Example:

"Incorrect email or password."

Do not reveal unnecessary security information.

For unverified account:

"Your account hasn't been verified yet."

CTA:

"Verify Account"

==================================================
8. FORGOT PASSWORD
==================================================

Create:

Forgot Password

"Enter your email or phone number and we'll help you reset your password."

Field:

Email / Phone

CTA:

"Send Verification Code"

Then:

OTP Verification

Then:

New Password

Confirm Password

Then:

✓ Password successfully changed.

CTA:

"Return to Login"

==================================================
9. PASSWORD REQUIREMENTS
==================================================

Create a password strength component.

Show:

At least 8 characters
Uppercase
Lowercase
Number
Special character

Example:

Password strength:

Weak
Medium
Strong

Use visual indicators.

==================================================
10. ROLE-BASED ACCOUNT CREATION
==================================================

After selecting:

TOURIST

→ Normal account creation
→ Email/phone verification
→ Profile setup
→ Tourist dashboard

VENDOR

→ Account creation
→ Email/phone verification
→ Vendor information
→ Business/shop information
→ Verification
→ Pending status
→ Admin approval
→ Vendor dashboard

TOUR GUIDE

→ Account creation
→ Email/phone verification
→ Guide profile
→ Identity/verification documents
→ Admin review
→ Pending status
→ Approved/rejected
→ Guide dashboard

IMPORTANT:

Do not show the "Verified Guide" badge until admin approval is completed.

==================================================
11. TOURIST PROFILE
==================================================

Create:

Profile
Personal Information
Email
Phone
Profile photo
Country
Preferred language
Travel preferences

Security:

Change Password
Two-factor authentication
Login activity
Active sessions

Privacy:

Location permission
Location sharing
Profile visibility
Notification preferences

Account:

Delete account
Deactivate account
Logout

==================================================
12. VENDOR ONBOARDING
==================================================

Create a multi-step vendor registration.

Step 1:
Personal Information

Name
Email
Phone

Step 2:
Business Information

Shop Name
Business Type
Business Address
District
Description

Step 3:
Documents

Business registration
Identity document
Other required documents

Step 4:
Shop Information

Logo
Cover image
Categories
Pickup location

Step 5:
Review

Show all information.

CTA:

"Submit for Verification"

==================================================
13. VENDOR VERIFICATION STATUS
==================================================

Create separate screens for:

PENDING

"Your vendor application is under review."

Show:

Submitted date
Application ID
Documents submitted

Status:

🟡 Pending Review

APPROVED

✓ Vendor Verified

"Your shop has been approved."

CTA:

"Go to Vendor Dashboard"

REJECTED

"Your application needs attention."

Show:

Reason for rejection

CTA:

"Update Application"

RESUBMIT

==================================================
14. TOUR GUIDE ONBOARDING
==================================================

Create a professional multi-step guide verification process.

Step 1:
Personal Information

Full Name
Profile photo
Phone
Email

Step 2:
Professional Information

Years of experience
Languages
Specialization
Tour areas
About
Pricing

Step 3:
Identity Verification

Upload:

Government ID
Guide certification if applicable
Profile photo

Step 4:
Availability

Available days
Available hours
Tour types

Step 5:
Location Permission

Explain:

"Your location is only shared with tourists when you enable 'Available for Tour'."

Options:

Allow location sharing
Not now

Step 6:

Review & Submit

CTA:

"Submit for Verification"

==================================================
15. TOUR GUIDE VERIFICATION STATUS
==================================================

Create four states.

1. DRAFT

"Complete your profile to apply for verification."

2. PENDING

"Your guide profile is being reviewed."

Show:

Application ID
Submitted date
Documents
Review status

3. APPROVED

Large:

✓ VERIFIED GUIDE

"Your profile has been approved."

Show verified badge preview.

CTA:

"Go to Guide Dashboard"

4. REJECTED

"Your application was not approved."

Show:

Reason
Required corrections

CTA:

"Update & Resubmit"

==================================================
16. ADMIN VERIFICATION SYSTEM
==================================================

Create a complete Admin Verification Center.

Sidebar:

Dashboard
Users
Vendors
Tour Guides
Verification
Places
Products
Orders
Pre-orders
Reviews
Events
Stories
Reports
Settings

Verification page:

Tabs:

All
Pending
Approved
Rejected

Filters:

Role
Date
Location
Status

Table:

Applicant
Role
Application ID
Submitted
Status
Action

Example:

Rahim Ahmed
Tour Guide
TG-1024
15 Aug
Pending

Button:

"Review"

==================================================
17. ADMIN GUIDE REVIEW PAGE
==================================================

Create a detailed verification page.

Header:

Tour Guide Verification

Applicant:

Profile photo
Name
Location
Rating if existing
Application ID

Sections:

PERSONAL INFORMATION

Professional Information

Languages

Experience

Tour Areas

Documents

Government ID
Certification
Profile photo

Show document preview cards.

Admin actions:

✓ Approve

✕ Reject

↩ Request More Information

If rejecting:

Open modal:

"Reason for rejection"

[Text area]

Button:

"Reject Application"

==================================================
18. REQUEST MORE INFORMATION
==================================================

Admin can request additional documents.

Modal:

"Additional information required"

Reason:

"Please upload a clearer copy of your government ID."

Required action:

Upload document

Deadline:

Optional

Button:

"Send Request"

Guide receives notification.

==================================================
19. VERIFIED BADGE SYSTEM
==================================================

Create reusable badges.

Verified Guide:

✓ Verified Guide

Verified Vendor:

✓ Verified Vendor

Verified Product:

✓ Authentic

Pending:

🟡 Pending Verification

Rejected:

🔴 Verification Required

The verified badge should appear on:

Guide profile
Guide cards
Map cards
Vendor profile
Vendor cards
Product cards where applicable

==================================================
20. DATABASE-RELATED UI
==================================================

The future backend will store user information.

Design UI that clearly corresponds to stored data.

USER DATA:

User ID
Full Name
Email
Phone
Password authentication
Role
Profile image
Account status
Email verification status
Phone verification status
Created date
Last login
Location permission
Notification settings

TOUR GUIDE DATA:

Guide ID
User ID
Bio
Languages
Experience
Specialization
Tour areas
Pricing
Availability
Verification status
Documents
Rating
Reviews
Current/approximate location when sharing is enabled

VENDOR DATA:

Vendor ID
User ID
Shop name
Business information
Address
Products
Verification status
Documents
Rating

PRODUCT DATA:

Product ID
Vendor ID
Name
Category
Price
Images
Description
Stock
GI status
Pickup availability
Pre-order availability
Preparation time
Location

ORDER DATA:

Order ID
User ID
Vendor ID
Products
Quantity
Total
Advance payment
Remaining payment
Payment status
Order status
Pickup date
Pickup time
Pickup location
QR/pickup code

GUIDE BOOKING DATA:

Booking ID
Tourist ID
Guide ID
Date
Time
Location
Status
Price
Payment status

==================================================
21. ACCOUNT STATUS SYSTEM
==================================================

Design account status badges:

Active
Pending
Unverified
Suspended
Blocked
Deactivated

Examples:

🟢 Active

🟡 Pending

⚪ Unverified

🔴 Suspended

Create appropriate UI for each state.

==================================================
22. ACCOUNT SUSPENSION
==================================================

Admin can suspend accounts.

Create modal:

"Suspend Account"

Reason:

[Text area]

Duration:

Temporary
Permanent

CTA:

"Suspend Account"

User sees:

"Your account has been suspended."

Show:

Reason
Support contact
Appeal option if applicable

==================================================
23. SECURITY SETTINGS
==================================================

Create:

Security & Privacy page.

Sections:

Password

Change Password

Two-factor authentication

[Enable]

Login Activity

Show:

Device
Location
Date
Time

Active Sessions

Current device
Other devices

CTA:

"Log out of all other sessions"

==================================================
24. LOCATION PRIVACY
==================================================

This is especially important for tour guides.

Create:

Location & Privacy

Guide sees:

Location Sharing

OFF

"Your location is currently hidden."

Toggle ON:

"Your approximate/current location may be visible to nearby tourists while you are available for tours."

Show:

✓ Location permission granted

or:

"Location permission required"

CTA:

"Allow Location"

Do not expose a guide's exact location unnecessarily.

==================================================
25. NOTIFICATION SETTINGS
==================================================

Create:

Notification Settings

Email
SMS
Push

Categories:

Orders
Pre-orders
Guide bookings
Messages
Verification
Reviews
Events
Security

Each should have toggle controls.

==================================================
26. SESSION / LOGOUT
==================================================

Create:

Logout confirmation modal:

"Are you sure you want to log out?"

Cancel
Log Out

Also create:

Session expired:

"Your session has expired. Please log in again."

CTA:

"Log In"

==================================================
27. AUTHENTICATION SUCCESS STATES
==================================================

Create polished success states:

✓ Account Created

✓ Email Verified

✓ Phone Verified

✓ Login Successful

✓ Password Changed

✓ Profile Updated

✓ Vendor Application Submitted

✓ Guide Application Submitted

✓ Guide Verified

==================================================
28. ERROR STATES
==================================================

Design reusable error states for:

Network error
Server error
Invalid input
Unauthorized
Session expired
Permission denied
Verification failed
Document upload failed
Payment verification failed

Use clear human-friendly messages.

==================================================
29. ACCESS CONTROL UX
==================================================

If a tourist tries to access vendor dashboard:

Show:

"Access restricted"

"You don't have permission to access this page."

CTA:

"Go to My Dashboard"

If an unverified guide tries to use guide features:

Show:

"Complete verification to access this feature."

CTA:

"Complete Verification"

If a vendor is pending:

Show:

"Your vendor account is awaiting approval."

==================================================
30. PROFILE COMPLETION
==================================================

Create profile completion progress.

Example:

Your profile is 75% complete.

██████████████░░░░

Missing:

✓ Name
✓ Phone
✓ Profile photo
○ Travel preferences

CTA:

"Complete Profile"

For guides:

Profile completion should be required before verification submission.

==================================================
31. ADMIN USER MANAGEMENT
==================================================

Create Admin → Users page.

Table:

User
Role
Email
Phone
Status
Verification
Joined
Last Login
Actions

Actions:

View
Edit
Suspend
Deactivate
Delete if permitted

User detail page:

Profile
Account information
Verification
Activity
Orders
Bookings
Reviews
Security status

==================================================
32. ADMIN VERIFICATION DASHBOARD
==================================================

Dashboard cards:

Pending Guide Applications
Pending Vendor Applications
Verified Guides
Verified Vendors
Rejected Applications

Charts:

Verification trends
Applications by role
Applications by location

==================================================
33. AUDIT / ACTIVITY LOG
==================================================

Create Admin Activity Logs.

Examples:

Admin approved Guide TG-1024
Admin rejected Vendor VN-204
User changed password
Guide uploaded verification document
Vendor updated business information

Columns:

Date
Actor
Action
Target
Status

==================================================
34. DATABASE CONNECTION PLACEHOLDERS
==================================================

Although Figma does NOT create the actual database, design the UI with the assumption that the application will later connect to:

Authentication system
User database
Role management
Verification database
Product database
Order database
Guide booking database
Payment database
Notification database
Review database

Use realistic states for data loading:

Loading...
No data
Data loaded
Error
Unauthorized

==================================================
35. COMPLETE AUTH FLOW PROTOTYPE
==================================================

Connect the Figma prototype:

Landing
→ Sign Up
→ Select Role
→ Registration
→ OTP
→ Profile Setup
→ Dashboard

And:

Landing
→ Login
→ Authentication
→ Role-based Dashboard

Forgot password:

Login
→ Forgot Password
→ Email/Phone
→ OTP
→ New Password
→ Success
→ Login

==================================================
36. COMPLETE GUIDE VERIFICATION FLOW
==================================================

Connect:

Guide Sign Up
→ OTP
→ Guide Profile
→ Professional Info
→ Documents
→ Location Permission
→ Review
→ Submit
→ Pending
→ Admin Review
→ Approved / Rejected / More Information

Approved:

Approved
→ Verified Badge
→ Guide Dashboard

Rejected:

Rejected
→ Reason
→ Update
→ Resubmit

==================================================
37. COMPLETE VENDOR VERIFICATION FLOW
==================================================

Vendor Sign Up
→ OTP
→ Business Information
→ Documents
→ Shop Information
→ Review
→ Submit
→ Pending
→ Admin Review
→ Approved / Rejected
→ Vendor Dashboard

==================================================
38. DESIGN SYSTEM
==================================================

Create reusable Figma components for:

Input
Password input
OTP input
Select
Checkbox
Radio
Toggle
Button
Modal
Toast
Badge
Status
Document card
Verification card
Profile card
User table
Admin table
Empty state
Error state
Loading state

Create variants for:

Default
Hover
Focus
Disabled
Error
Success
Loading

==================================================
39. MOBILE AUTHENTICATION
==================================================

Design mobile versions for:

Login
Sign up
OTP
Forgot password
Profile
Verification
Document upload
Admin verification where appropriate

Ensure forms are easy to use on mobile.

==================================================
40. FINAL PROTOTYPE GOAL
==================================================

The final Figma file should demonstrate that HeritageBD has a complete and professional identity/authentication/verification system.

The complete lifecycle should be visually understandable:

USER

Sign Up
↓
Verify
↓
Profile
↓
Role
↓
Access

VENDOR

Register
↓
Verify
↓
Submit Documents
↓
Admin Review
↓
Approve
↓
Verified Vendor
↓
Vendor Dashboard

GUIDE

Register
↓
Verify
↓
Complete Profile
↓
Submit Documents
↓
Admin Review
↓
Approve
↓
Verified Guide
↓
Available for Tour
↓
Location Sharing
↓
Guide Dashboard

ADMIN

Login
↓
Admin Dashboard
↓
Review Applications
↓
Verify Users
↓
Manage Platform

IMPORTANT FINAL REQUIREMENT:

Do not design only the happy path.

For every important authentication and verification flow, create:

- Success state
- Error state
- Pending state
- Rejected state
- Loading state
- Empty state
- Unauthorized state
- Suspended state where relevant

The design must be developer-ready and clearly show how the frontend will interact with a future backend/database.

Maintain the existing HeritageBD visual identity and integrate all of these screens into the existing design system.