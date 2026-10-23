# UML diagrams

All diagrams are [Mermaid](https://mermaid.js.org/), which GitHub, GitLab and VS Code (with the
Markdown Mermaid extension) render inline. They describe the code as of 2026-10-24; the
controller and table names match the source.

| # | Diagram | UML type |
|---|---|---|
| 1 | [System context](#1-system-context) | Component / deployment |
| 2 | [Use cases by role](#2-use-cases-by-role) | Use case (as flowchart) |
| 3 | [Domain model](#3-domain-model) | Class |
| 4 | [Database relationships](#4-database-relationships) | Entity–relationship |
| 5 | [Request lifecycle](#5-request-lifecycle) | Sequence |
| 6 | [Login with rate limiting](#6-login-with-rate-limiting) | Sequence |
| 7 | [Marketplace order and settlement](#7-marketplace-order-and-settlement) | Sequence |
| 8 | [Guide booking and settlement](#8-guide-booking-and-settlement) | Sequence |
| 9 | [Order states](#9-order-states) | State machine |
| 10 | [Pre-order states](#10-pre-order-states) | State machine |
| 11 | [Guide booking states](#11-guide-booking-states) | State machine |
| 12 | [Local foods and products by area](#12-local-foods-and-products-by-area) | Sequence |
| 13 | [Frontend component structure](#13-frontend-component-structure) | Component |

---

## 1. System context

```mermaid
flowchart LR
    subgraph Browser
        SPA["React 19 SPA<br/>src/ (Vite, lazy routes)"]
        LS[("localStorage<br/>heritagebd_token")]
        SPA --- LS
    end
    subgraph API["PHP 8 API · backend/"]
        IDX["index.php<br/>route table"]
        CTRL["controllers/*<br/>one file per resource"]
        HLP["helpers/<br/>auth · throttle · areas<br/>earnings · payments · notify"]
        IDX --> CTRL --> HLP
    end
    DB[("MySQL / MariaDB<br/>~52 tables")]
    FS[("heritagebd-data/uploads<br/>products · profiles · private")]
    PAY["Payment gateway<br/>(not connected; demo stub)"]
    MAIL["PHP mail()<br/>reset codes"]

    SPA -- "fetch /api/* + Bearer token" --> IDX
    CTRL -- PDO --> DB
    CTRL -- files --> FS
    HLP -. collect_advance .-> PAY
    CTRL -. OTP .-> MAIL
```

## 2. Use cases by role

```mermaid
flowchart LR
    T([Tourist]) --- T1[Explore places & map]
    T --- T2[See traditional foods & local products by area]
    T --- T3[Book a guide · pay 20% advance]
    T --- T4[Shop · checkout · pay 20% advance]
    T --- T5[Pre-order for pickup · pay 30%]
    T --- T6[Confirm delivery / tour completion]
    T --- T7[Plan trips · chat · review]

    V([Vendor]) --- V1[Onboard & upload documents]
    V --- V2[Manage products & stock]
    V --- V3[Process orders step by step]
    V --- V4[Run pre-orders · verify QR]
    V --- V5[View earnings]

    G([Guide]) --- G1[Onboard & upload documents]
    G --- G2[Accept / reject bookings]
    G --- G3[Mark tour finished]
    G --- G4[Respond to shared trip plans]
    G --- G5[View earnings]

    A([Admin]) --- A1[Verify vendors & guides]
    A --- A2[Suspend users · moderate reviews]
    A --- A3[Manage places, events, stories, homepage images]
    A --- A4[Manage traditional foods]
    A --- A5[Set advance & commission rates]
    A --- A6[View platform earnings]
```

## 3. Domain model

```mermaid
classDiagram
    direction LR
    class User {
        id
        name
        email
        role
        status
    }
    class Vendor {
        shopName
        location
        verificationStatus
        rating
    }
    class Guide {
        pricePerDay
        isAvailable
        isLocationSharing
        verificationStatus
    }
    class HeritagePlace {
        name
        district
        division
        category
    }
    class Product {
        price
        stock
        category
        district
        preorderEnabled
    }
    class LocalFood {
        name
        nameLocal
        district
        division
        type
        featured
    }
    class Order {
        status
        totalAmount
        advancePercent
        commissionPercent
        advanceStatus
    }
    class PreOrder {
        status
        qrCode
        remainingAmount
        advanceStatus
    }
    class GuideBooking {
        status
        startDate
        endDate
        totalPrice
        advanceStatus
    }
    class Settlement {
        flow
        grossAmount
        commissionAmount
        partnerReleased
        partnerCash
    }
    class CommissionSetting {
        flow
        advancePercent
        commissionPercent
    }

    User <|-- Vendor : role=vendor
    User <|-- Guide : role=guide
    Vendor "1" --> "*" Product : sells
    Product "*" --> "*" HeritagePlace : near
    User "1" --> "*" Order : places
    Order "1" --> "*" Product : order_items
    User "1" --> "*" PreOrder : tourist
    PreOrder "*" --> "1" Product
    User "1" --> "*" GuideBooking : tourist
    GuideBooking "*" --> "1" Guide
    Order ..> Settlement : on completed
    PreOrder ..> Settlement : on completed
    GuideBooking ..> Settlement : on completed
    CommissionSetting ..> Order : snapshot at creation
    CommissionSetting ..> GuideBooking : snapshot
    CommissionSetting ..> PreOrder : snapshot
    LocalFood ..> HeritagePlace : same district / division
```

## 4. Database relationships

Core tables only; child tables such as `product_images` or `guide_languages` are omitted.

```mermaid
erDiagram
    users ||--o| vendors : "user_id"
    users ||--o| guides : "user_id"
    users ||--o{ auth_tokens : "sha256 tokens"
    users ||--o{ user_documents : uploads
    vendors ||--o{ products : vendor_id
    products ||--o{ product_near_destinations : ""
    heritage_places ||--o{ product_near_destinations : ""
    users ||--o{ cart_items : ""
    users ||--o{ orders : tourist
    orders ||--|{ order_items : ""
    products ||--o{ order_items : ""
    users ||--o{ preorders : tourist
    products ||--o{ preorders : ""
    guides ||--o{ guide_bookings : guide_id
    users ||--o{ guide_bookings : tourist_id
    users ||--o{ trip_plans : owner
    trip_plans ||--o{ trip_days : ""
    trip_days ||--o{ trip_stops : ""
    users ||--o{ reviews : author
    users ||--o{ notifications : ""
    conversations ||--o{ messages : ""
    commission_settings ||..o{ settlements : "rates per flow"
    orders ||..o{ settlements : "flow=order"
    preorders ||..o| settlements : "flow=preorder"
    guide_bookings ||..o| settlements : "flow=guide_booking"
    local_foods }o..o{ heritage_places : "by district / division"
    auth_attempts }o..|| users : "by email or IP (no FK)"
```

## 5. Request lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (api.ts)
    participant I as index.php
    participant C as cors.php
    participant H as Controller
    participant A as helpers/auth.php
    participant D as MySQL

    B->>I: METHOD /api/... (Bearer token)
    I->>C: emit CORS headers
    alt OPTIONS pre-flight
        C-->>B: 204
    end
    I->>D: connect (time_zone = APP_TIMEZONE offset)
    I->>I: match $routes regex
    I->>H: handler($pdo, ...captures)
    H->>A: require_auth() / require_role()
    A->>D: SELECT user WHERE token = sha256(bearer)
    alt invalid / expired / suspended
        A-->>B: 401 {success:false}
    end
    H->>D: prepared statements (transaction if money/stock)
    H-->>B: 200 {success:true, data}
    Note over I,B: Uncaught Throwable → error_log + generic 500
```

## 6. Login with rate limiting

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant L as auth_login
    participant T as throttle.php
    participant D as MySQL

    B->>L: POST /auth/login {email, password}
    L->>T: throttle_check(login_email, email, 5)
    L->>T: throttle_check(login_ip, IP, 20)
    alt limit reached in last 15 min
        T-->>B: 429 + Retry-After: 900
    end
    L->>D: SELECT user by email
    alt wrong password
        L->>T: throttle_hit(email) + throttle_hit(IP)
        L-->>B: 401
    else suspended
        L-->>B: 403
    else ok
        L->>T: throttle_clear(email)
        L->>D: INSERT auth_tokens (sha256(token))
        L-->>B: 200 {user, token}
    end
```

## 7. Marketplace order and settlement

```mermaid
sequenceDiagram
    autonumber
    actor T as Tourist
    participant API as orders_controller
    participant P as payments.php
    participant E as earnings.php
    actor V as Vendor
    participant D as MySQL

    T->>API: POST /orders (cart, address, bkash)
    API->>D: BEGIN · reprice from DB · lock + decrement stock
    API->>P: collect_advance(20% of total)
    P-->>API: true (demo mode)
    API->>D: INSERT order per vendor (advance_status=held, +৳120 delivery) · COMMIT
    loop one step at a time
        V->>API: PUT /orders/{id} confirmed → preparing → shipped → out_for_delivery → delivered
    end
    Note over API: delivered does NOT release money
    T->>API: PUT /orders/{id} {status: completed}
    API->>E: settle_order()
    E->>D: INSERT settlements (admin 10%, vendor 10% + 80% cash)
    E->>D: UPDATE orders SET advance_status=released WHERE held
    API-->>T: 200
```

## 8. Guide booking and settlement

```mermaid
sequenceDiagram
    autonumber
    actor T as Tourist
    participant API as bookings_controller
    actor G as Guide
    participant E as earnings.php

    T->>API: POST /bookings (dates, tour type)
    API->>API: reject overlapping pending/accepted bookings
    API-->>T: 201 (20% advance held)
    G->>API: PUT status=accepted
    Note over G,API: after the tour's last day
    G->>API: PUT status=awaiting_confirmation
    T->>API: PUT status=completed (tour done, cash balance paid)
    API->>E: settle_booking()
    E-->>API: admin 10% · guide 10% + 80% cash
```

## 9. Order states

```mermaid
stateDiagram-v2
    [*] --> placed : checkout (20% advance held)
    placed --> confirmed : vendor (estimated delivery date)
    placed --> cancelled
    confirmed --> preparing : vendor
    confirmed --> cancelled
    preparing --> shipped : vendor
    shipped --> out_for_delivery : vendor
    out_for_delivery --> delivered : vendor
    delivered --> completed : tourist confirms → settle_order()
    cancelled --> [*] : stock restored, advance refunded
    completed --> [*]
```

## 10. Pre-order states

```mermaid
stateDiagram-v2
    [*] --> confirmed
    confirmed --> advance_paid
    advance_paid --> vendor_accepted : vendor
    vendor_accepted --> preparing : vendor
    preparing --> ready_for_pickup : vendor
    ready_for_pickup --> arrived : tourist or vendor
    arrived --> qr_verified : vendor + matching QR code
    qr_verified --> pickup_payment_pending : vendor
    pickup_payment_pending --> picked_up : vendor + 70% payment method
    picked_up --> completed : vendor → settle_preorder()
    completed --> [*]

    state cancellable <<choice>>
    confirmed --> cancellable
    advance_paid --> cancellable
    vendor_accepted --> cancellable
    preparing --> cancellable
    ready_for_pickup --> cancellable
    arrived --> cancellable
    qr_verified --> cancellable
    pickup_payment_pending --> cancellable
    cancellable --> cancelled : tourist, vendor or admin + reason
    cancelled --> [*] : advance refunded, stock restored
```

> `refunded` exists in the enum and is admin-only in `PREORDER_TRANSITION_ROLES`, but no state lists
> it as a next step, so it can't currently be reached. See [known-issues.md](known-issues.md).

## 11. Guide booking states

```mermaid
stateDiagram-v2
    [*] --> pending : tourist books (20% advance held)
    pending --> accepted : guide
    pending --> rejected : guide
    pending --> cancelled : tourist
    accepted --> awaiting_confirmation : guide, after last day
    accepted --> cancelled : tourist or guide
    awaiting_confirmation --> completed : tourist confirms → settle_booking()
    rejected --> [*]
    cancelled --> [*]
    completed --> [*]
```

## 12. Local foods and products by area

```mermaid
sequenceDiagram
    autonumber
    participant UI as LocalTaste.tsx
    participant F as local_foods_controller
    participant P as products_controller
    participant AR as helpers/areas.php
    participant D as MySQL

    UI->>F: GET /local-foods?area=Cox's Bazar&scope=district
    F->>AR: resolve_area() → district Cox's Bazar, division Chattogram
    F->>D: SELECT foods in division Chattogram, Cox's Bazar first
    F-->>UI: foods [areaMatch local | nearby]
    UI->>P: GET /products?area=Cox's Bazar&scope=district
    P->>AR: area_query_terms() → focus (district + aliases), broad (division)
    P->>D: match product district / pickup point / linked place / vendor address
    P-->>UI: products sorted local first [areaMatch]
    Note over UI: Shop passes exact=1 when a district is picked,<br/>so only that district is listed.
```

## 13. Frontend component structure

```mermaid
flowchart TB
    App["App.tsx<br/>AppProvider · BrowserRouter · Suspense"] --> RR["RequireRole guard"]
    App --> Pages
    subgraph Pages["pages/ (React.lazy)"]
        Landing
        Shop
        PlaceDetail
        TripPlanner
        Dashboards["Vendor / Guide / Admin dashboards"]
        Others["… 35 more"]
    end
    Shop --> LT["components/local/LocalTaste"]
    PlaceDetail --> LT
    TripPlanner --> LT
    LT --> PC["cards/ProductCard"]
    Dashboards --> AS["admin/AdminSections<br/>incl. LocalFoodsSection"]
    Pages --> Hook["hooks/useApiData"]
    LT --> Hook
    Hook --> API["services/api.ts<br/>request · upload · ApiError"]
    App --> Ctx["context/AppContext<br/>session · cart · notifications (20 s poll)"]
    Ctx --> API
```
