# Frontend

Entry: `src/main.tsx` → `src/App.tsx`. `App` wraps everything in `AppProvider` and `BrowserRouter`,
renders a global `ApiActionNotice` toast for `actionError`, then the route table.

## Layouts

| Wrapper | Used for |
|---|---|
| `Layout` | Navbar + page + Footer (most public pages) |
| `FullLayout` | Bare `<main>` (auth, onboarding, pre-order flow, guide tour planner) |
| Navbar only | `/map`, `/chat`, `/admin`, `/admin/guides` |

## Code splitting

Every page except `Landing` is loaded with `React.lazy`, and `<Suspense>` in `App` shows a spinner while
a page's chunk downloads. The main bundle is about 334 KB (100 KB gzipped). Add new pages the same way.

## Route guard

`RequireRole roles={[...]}` shows a spinner while the session is restoring, redirects anonymous users
to `/login?from=<path>`, and sends users with the wrong role to `/`. This is a UX guard only; the API
enforces roles on every request.

## Routes

| Path | Page | Roles |
|---|---|---|
| `/` | Landing | public |
| `/explore` | Explore | public |
| `/places`, `/places/:id` | Places, PlaceDetail | public |
| `/map` | MapPage (Leaflet) | public |
| `/guides`, `/guides/:id` | GuideListing, GuideProfile | public |
| `/shop`, `/shop/:id` | Shop (`?area=`, `?filter=ready-to-pick`), ProductDetail | public |
| `/cart` | Cart | public |
| `/checkout` | Checkout | tourist |
| `/order-tracking` | OrderTracking | tourist, vendor, admin |
| `/events`, `/events/:id` | Events, EventDetail | public |
| `/stories`, `/stories/:id` | Stories, StoryDetail | public |
| `/planner` | TripPlanner | tourist |
| `/profile` | TouristProfile | tourist |
| `/settings` | AccountSettings | any signed-in |
| `/chat` | ChatInterface | any signed-in |
| `/preorder/checkout` | PreOrderCheckout | tourist |
| `/preorder/tracking/:orderId` | PreOrderTracking | tourist, vendor, admin |
| `/preorder/qr/:orderId` | PreOrderQR | tourist, vendor, admin |
| `/guide-dashboard` | GuideDashboard | guide |
| `/guide/tour-planner` | TourPlanner | guide |
| `/vendor` | VendorDashboard | vendor |
| `/admin` | AdminDashboard (+ `AdminSections.tsx`) | admin |
| `/admin/guides` | GuideVerification | admin |
| `/login`, `/signup`, `/forgot-password` | Auth pages | public |
| `/onboarding/vendor`, `/onboarding/guide` | Onboarding wizards | vendor / guide |
| `/vendor/verification-status`, `/guide/verification-status` | VerificationStatus | vendor / guide |
| `/suspended`, `/session-expired` | Status pages | public |
| `*` | Landing (no 404 page) | public |

## Global state — `src/context/AppContext.tsx`

Exposed through `useApp()`:

- **Session**: `currentUser`, `userRole`, `authLoading`, `login`, `register`, `logout`,
  `updateCurrentUser`. On mount, a saved token is validated with `GET /auth/me`.
- **Cart**: `cart`, `cartTotal`, `cartCount`, `addToCart`, `removeFromCart`, `updateCartQty`,
  `clearCart`. Loaded from `/cart` after login. Anonymous users keep a local-only cart that is
  replaced by the server cart on login.
- **Notifications**: `notifications`, `unreadCount`, `markNotificationRead`,
  `markAllNotificationsRead`. Polled every 20 s while the tab is visible.
- **Errors**: `actionError` / `clearActionError` back the global toast.

Everything else is page-local state (`useState` + `useEffect` calling `services/api.ts`).
`src/hooks/useApiData.ts` is a small loading/error helper for that pattern. It takes its data type
from the **fallback** argument (`NoInfer` on the fetcher), so always pass a typed fallback such as
`[] as Product[]` or `null as PaymentTerms | null`.

## API client — `src/services/api.ts`

One module, grouped by resource: `authApi`, `vendorApi`, `documentsApi`, `productImagesApi`,
`profileImagesApi`, `siteContentApi`, `placesApi`, `categoriesApi`, `guidesApi`, `bookingsApi`,
`guidePaymentsApi`, `paymentTermsApi`, `earningsApi`, `productsApi`, `cartApi`, `ordersApi`,
`preordersApi`, `eventsApi`, `storiesApi`, `reviewsApi`, `tripsApi`, `notificationsApi`, `chatApi`,
`adminApi`.

- `request()` adds JSON headers and the bearer token, unwraps `{ success, data }` and throws
  `ApiError(message, status)` on failure (status `0` = network error).
- `upload()` posts `FormData` (images, documents).
- `fetchProtectedFile()` downloads admin-only documents as a `Blob`.
- Response payloads are mostly typed `any`; `src/types/index.ts` holds the intended shapes.

## Local foods and products (`components/local/LocalTaste.tsx`)

`<LocalTaste query={{ area, scope?, exact? }} label tabs? productLimit? />` renders "Taste & take
home from {label}" with two tabs, traditional foods and local products, fetched from `/local-foods`
and `/products?area=`. Items from the area itself come first; the rest of the division is tagged
"nearby". Foods without a photo show an emoji for their type.

| Used in | Query |
|---|---|
| Trip planner result | `{ area: destination.district, scope: 'district' }` |
| Place page, Overview tab | `{ area: place.district, scope: 'district' }` (the Pre-Order tab uses the same area) |
| Shop, when `?area=` is set | division chip → `{ area }`; district dropdown → `{ area, scope: 'district', exact: true }`; foods tab only |
| Admin → Traditional Foods | `LocalFoodsSection` in `AdminSections.tsx` (create, feature, photo, delete) |

API client: `areasApi.list()`, `localFoodsApi.list/create/update/remove`,
`productsApi.byArea(query, extra)`; types `AreaDivision`, `LocalFood`, `LocalFoodType`, `AreaQuery`.

## Static / mock data still in use

| File | Used by | Role |
|---|---|---|
| `data/mockData.ts` → `mockEvents` | Landing, Events, EventDetail | Dev fallback when `/events` fails |
| `data/preorderData.ts` → `preOrderStatusConfig` | VendorDashboard, PreOrderTracking | Status labels/colours (fine to keep) |
| `data/preorderData.ts` → `mockPreOrderSettings` | AdminDashboard | Default settings before API load |

The trip planner's "generate itinerary" wizard uses built-in sample routes, then saves the result via
`/trips`.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`; global styles and theme tokens live in `src/index.css`. There
is no Tailwind config file. Icons come from `lucide-react`; charts from `recharts`.

## Conventions

- Pages and components are default exports.
- Strings with apostrophes use double quotes (an unescaped `'` in a single-quoted string breaks the build).
- Large pages (`TripPlanner.tsx` 74 KB, `AdminDashboard.tsx` 53 KB, `VendorDashboard.tsx` 47 KB) are
  candidates for splitting into sub-components.
