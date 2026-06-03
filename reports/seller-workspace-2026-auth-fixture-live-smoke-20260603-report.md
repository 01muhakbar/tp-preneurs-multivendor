# Seller Workspace 2026 Auth Fixture Live Smoke Report

Date: 2026-06-03  
Task: `SELLER-2026-AUTH-FIXTURE-LIVE-SMOKE-02`

## Scope

- Audited local auth/session and seller store access flow.
- Created deterministic Seller Workspace 2026 fixture data against the Sequelize dev DB.
- Ran authenticated Playwright smoke through the canonical `/seller/stores/:storeSlug` live routes and legacy redirects.
- Verified owner/cross-store guard behavior and limited member session behavior.
- Patched one small runtime warning found by smoke.
- Re-ran typecheck, build, and targeted lint diagnostics.

## Auth And Access Findings

- Auth stack uses Express cookies through `/api/auth/login` and `/api/auth/me`; storefront seller users must not use admin roles.
- Seller access is resolved by `resolveSellerAccess` and `requireSellerStoreAccess`.
- Store owner bridge grants full store-scoped seller permissions when `stores.owner_user_id` matches the authenticated user.
- Active `store_members` plus active `store_roles` grants scoped member permissions.
- Prisma is not present in this project; fixture work uses Sequelize models and existing tables.
- Backend routes, permission map, DB schema, `SellerLayout`, Admin, Client Storefront, and analytics route were not changed.

## Fixture

Reusable script:

```powershell
pnpm exec tsx scripts/seller2026-auth-fixture-live-smoke.ts
```

Seeded credentials:

- Owner: `seller.owner@example.test` / `Password123!`
- Limited member: `seller.member@example.test` / `Password123!`
- Other store owner: `seller.other@example.test` / `Password123!`
- Buyer/order actor: `seller.buyer@example.test` / `Password123!`

Seeded live IDs from the verified run:

- Store: `tp-preneurs-demo-store`, id `1436`
- Cross-store guard store: `other-demo-store`, id `1437`
- Product detail/edit product id: `2135`
- Attribute values attribute id: `322`
- Order detail suborder id: `1647`
- Team member detail id: `799`

Seed coverage:

- Active store owner/member relationships.
- Active shipping setup and active QRIS payment profile.
- Categories, attributes, attribute values, active/draft/submitted/inactive products.
- Active/scheduled/paused coupons.
- Suborders across pending confirmation, paid/processing, shipped, delivered.
- Pending payment proof for seller review.
- Team audit rows and seller notification.

## Browser Smoke Results

Runner: local Playwright Chromium through Vite `http://localhost:5173` and API `http://localhost:3001`.

Canonical route result: PASS

- `/seller/stores/tp-preneurs-demo-store`
- `/seller/stores/tp-preneurs-demo-store/dashboard`
- `/seller/stores/tp-preneurs-demo-store/store-profile`
- `/seller/stores/tp-preneurs-demo-store/microsite-preview`
- `/seller/stores/tp-preneurs-demo-store/catalog/products`
- `/seller/stores/tp-preneurs-demo-store/catalog/products/new`
- `/seller/stores/tp-preneurs-demo-store/catalog/products/2135`
- `/seller/stores/tp-preneurs-demo-store/catalog/products/2135/edit`
- `/seller/stores/tp-preneurs-demo-store/catalog/categories`
- `/seller/stores/tp-preneurs-demo-store/catalog/attributes`
- `/seller/stores/tp-preneurs-demo-store/catalog/attributes/322/values`
- `/seller/stores/tp-preneurs-demo-store/catalog/coupons`
- `/seller/stores/tp-preneurs-demo-store/orders`
- `/seller/stores/tp-preneurs-demo-store/orders/1647`
- `/seller/stores/tp-preneurs-demo-store/payment-review`
- `/seller/stores/tp-preneurs-demo-store/payment-profile`
- `/seller/stores/tp-preneurs-demo-store/team`
- `/seller/stores/tp-preneurs-demo-store/team/799`
- `/seller/stores/tp-preneurs-demo-store/team/audit`
- `/seller/stores/tp-preneurs-demo-store/notifications`

Legacy redirect result: PASS

- `/seller/stores/tp-preneurs-demo-store/catalog` -> `/catalog/products`
- `/seller/stores/tp-preneurs-demo-store/catalog/new` -> `/catalog/products/new`
- `/seller/stores/tp-preneurs-demo-store/catalog/2135` -> `/catalog/products/2135`
- `/seller/stores/tp-preneurs-demo-store/catalog/2135/edit` -> `/catalog/products/2135/edit`
- `/seller/stores/tp-preneurs-demo-store/coupons` -> `/catalog/coupons`

Ownership result:

- Owner of `tp-preneurs-demo-store` visiting `/seller/stores/other-demo-store` receives the expected forbidden/access guard.
- API context status for cross-store slug: `403`.

Limited member smoke:

- `seller.member@example.test` can authenticate and open seller workspace routes for the fixture store.
- Orders and product read lanes load.
- Team/payment-profile restricted lanes render the workspace shell with page-level permission handling; they do not become session/cross-store failures.

## API Wiring

Observed seller API statuses during the authenticated owner smoke:

- Context by slug: `200`
- Workspace readiness: `200`
- Finance summary: `200`
- Analytics summary: `200`
- Store profile: `200`
- Products and authoring meta: `200`
- Product detail: `200`
- Categories: `200`
- Attributes: `200`
- Attribute values: `200`
- Coupons: `200`
- Suborders list/detail: `200`
- Payment review/profile APIs: `200`
- Team/audit APIs: `200`
- Notifications/unread count: `200`
- Cross-store context: expected `403`

## Patch Applied

- `client/src/features/seller2026/Seller2026Workspace.jsx`
  - Dashboard `Top Products` and `Recent Suborders` table row keys now include the row index.
  - This removes duplicate React key console errors when live API rows use fallback `-` identifiers.

- `scripts/seller2026-auth-fixture-live-smoke.ts`
  - Added reusable dev fixture + Playwright smoke runner.

- `system_map.md`
  - Added `Seller Workspace 2026 Live Smoke Status`.

## Diagnostics

- `pnpm exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`: PASS.
- `pnpm -F client exec tsc -b`: PASS.
- `pnpm -F client build`: PASS, with existing large-chunk warning for `vendor-misc`.
- Narrow lint: `pnpm -F client exec eslint src/features/seller2026/Seller2026Workspace.jsx src/pages/seller2026 src/hooks/seller2026 src/api/seller2026`: no errors; JSX workspace file is ignored by current ESLint config.
- Broader targeted lint over `src/api/seller*.ts`: FAIL due pre-existing `@typescript-eslint/no-explicit-any` debt in legacy/live bridge API modules, not introduced by this smoke.

## Remaining Notes

- Standalone Seller 2026 analytics route remains NEEDS REVIEW.
- Full repo lint remains blocked by broader existing lint debt.
- The fixture script is idempotent for the named smoke records and can be rerun before future live route checks.
