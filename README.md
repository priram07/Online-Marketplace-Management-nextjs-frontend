# MarketLoop — Shop + Seller Hub + Admin (one app)

A single Next.js 15 (App Router) frontend for the `Online-Marketplace-Management`
NestJS backend. It merges the former **customer-marketplace** and
**seller-marketplace** apps and adds a new **admin panel**.

| Portal | URL prefix | Who | Accent |
|---|---|---|---|
| Shop | `/` (unchanged URLs) | Customers | plum |
| Seller Hub | `/seller/...` | Sellers | clay |
| Admin | `/admin/...` | Administrators | steel |

## Setup

```bash
npm install
cp .env.local.example .env.local   # backend URL, admin login path, Pusher keys
npm run dev                         # http://localhost:3001
```

The NestJS backend is expected on `http://localhost:3000`, so this app runs on
**3001** to avoid a clash. Production: `npm run build && npm start`.

## What changed in the merge

- **One app, three route trees.** The customer pages moved into the `(shop)`
  route group (URLs are identical to before). The seller pages moved under
  `/seller`, with every internal link rewritten.
- **Three isolated sessions.** `lib/api.ts` builds three Axios clients
  (`api`, `sellerApi`, `adminApi`), each with its own localStorage keys and its
  own 401 handling. A customer, a seller and an admin can be signed in at the
  same time in one browser; logging out of one never touches the others.
- **One design system.** `tailwind.config.ts` + `app/globals.css` define an
  `accent` colour driven by CSS variables. Each portal layout sets
  `data-portal="shop|seller|admin"`, so shared pieces (`.btn-primary`, `.input`,
  `Spinner`, `NotificationBell`, sidebar links) pick up the right colour.
- **One notification channel.** A single `/api/notify` route and the shared
  Pusher `marketloop` channel serve all portals. `pushNotification()` now shows
  the notification in the current tab immediately *and* broadcasts it, so
  sellers and admins see their own actions even without Pusher configured.
- **Fix:** the shop and seller home pages are now `force-dynamic`. Previously,
  `next build` prerendered them once and baked in an empty catalogue if the
  backend was offline at build time.

## Admin panel

| Page | What it does | Axios calls |
|---|---|---|
| `/admin/login` | Sign in; rejects any JWT whose `role` isn't `admin` | `POST` login |
| `/admin` | Stats, orders-by-status chart, low stock, recent orders | `GET` customers, sellers, products, orders |
| `/admin/customers` | Search/filter, activate/deactivate | `GET`, `PATCH /customers/:id` |
| `/admin/sellers` | Search/filter, product counts, activate/deactivate | `GET`, `PATCH /sellers/:id` |
| `/admin/products` | Catalogue-wide moderation, remove listings | `GET`, `DELETE /products/:id` |
| `/admin/orders` | Filter and move orders through fulfilment | `GET`, `PATCH /orders/:id/status` |
| `/admin/categories` | Create, edit, delete categories (validated) | `GET`, `POST`, `PATCH`, `DELETE` |

Destructive actions use an inline two-step confirm. Every action raises a live
notification. The overview uses `Promise.all` over per-source loaders that never
throw, so one missing backend route greys out its own cards instead of breaking
the page.

## Backend contract for the admin panel

I built the admin against the routes the two existing frontends already call
plus the standard REST routes below. **I did not have the backend source**, so
the routes marked ⚠ are assumptions to verify. All of them live in one file,
`lib/admin.ts` → `ADMIN_ENDPOINTS`; rename a route there and nothing else needs
to change. When a route is missing, the admin UI says so explicitly
(`The backend doesn't expose GET /orders yet…`) rather than showing a blank page.

| Route | Status |
|---|---|
| `POST /admin/auth/login` → `{ accessToken }`, JWT `role: "admin"` | ⚠ path configurable via `NEXT_PUBLIC_ADMIN_LOGIN_PATH` |
| `GET /customers` (list) | ⚠ |
| `GET /sellers` (list) | ⚠ |
| `GET /orders` (list) | ⚠ |
| `PATCH /customers/:id` accepting `{ isActive }` | ⚠ (the shop currently sends `{ fullName }`) |
| `PATCH /sellers/:id` accepting `{ isActive }` | used by Seller Hub today |
| `PATCH /orders/:id/status` | used by the shop today (cancel) |
| `DELETE /products/:id` | ⚠ (sellers use `DELETE /sellers/:id/products/:id`) |
| `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` | ⚠ |
| `GET /products`, `GET /categories` | used by the shop today |

**Every ⚠ route that changes data must be protected by an admin role guard on
the server.** The frontend's role check only decides which screen to show; it
is not security. The `UploaderAuthGuard` comment in the seller code suggests an
admin JWT concept already exists in the backend.

## Project structure

```
app/
  layout.tsx                  html + Providers only
  not-found.tsx               global 404
  api/notify/route.ts         server-side Pusher trigger (shared)
  (shop)/                     customer portal — layout, home, products, cart, login, register, dashboard
  seller/                     seller portal — layout, landing, login, register, store/[id], dashboard/**
  admin/
    layout.tsx, login/, loading.tsx, not-found.tsx
    (panel)/                  protected: layout (sidebar), page, customers, sellers, products, orders, categories
components/
  shop/  seller/  admin/      portal-specific UI
  Spinner, FormField, NotificationBell, StatCard, Providers   shared
context/                      AuthContext (shop), SellerAuthContext, AdminAuthContext, CartContext, NotificationContext
lib/
  api.ts                      three Axios clients + error helper
  types.ts                    all backend shapes
  validations.ts              shop forms        seller-validations.ts   admin-validations.ts
  admin.ts                    ADMIN_ENDPOINTS, describeAdminError, useAdminData
  notify.ts, pusherClient.ts
```

## Verification done

`tsc --noEmit` and `next build` are clean (27 routes). A headless-browser run
against a mock backend passed 44 checks across all three portals: route
protection and redirects, admin-vs-non-admin login, filters, every admin
mutation, validation, notifications, per-portal accent colours, and coexisting
sessions. It was not run against your real backend.
