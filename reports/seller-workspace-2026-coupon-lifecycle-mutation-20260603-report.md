# Seller Workspace 2026 Coupon Lifecycle Mutation Report

Date: 2026-06-03

## Scope
- Enabled coupon lifecycle mutations for `/seller/stores/:storeSlug/catalog/coupons`.
- Preview route `/seller-2026/catalog-tools` remains mock-only.
- Backend routes, schema, auth middleware, permission map, Admin Workspace, and Client Storefront were not changed.
- Root docs requested in the task do not exist in this repo; the active Seller 2026 docs under `docs/seller-2026/*` were updated instead.

## Backend Contract Review

| Capability | Client/API helper | Endpoint | Store scope | Permission | Payload | Response | Decision |
|---|---|---|---|---|---|---|---|
| List | `listSellerCoupons` | `GET /api/seller/stores/:storeId/coupons` | `scopeType: "STORE"` and `storeId` | `COUPON_VIEW` | none | `{ items, store, governance }` | Read lane already live |
| Create | `createSellerCoupon`, `createSeller2026Coupon` | `POST /api/seller/stores/:storeId/coupons` | Backend forces `scopeType: "STORE"` and `storeId` | `COUPON_CREATE` | Supported coupon fields only | coupon DTO | Wire now |
| Edit | `updateSellerCoupon`, `updateSeller2026Coupon` | `PATCH /api/seller/stores/:storeId/coupons/:couponId` | Store-scoped coupon lookup | `COUPON_EDIT` | Supported coupon fields; `active` requires status permission | coupon DTO | Wire now |
| Activate/deactivate | `setSeller2026CouponStatus` | `PATCH /api/seller/stores/:storeId/coupons/:couponId` | Store-scoped coupon lookup | `COUPON_EDIT` plus `COUPON_STATUS_MANAGE` for `active` | `{ active }` | coupon DTO | Wire now |
| Archive/deactivate | `archiveSeller2026Coupon`, `deleteSellerCoupon` | `DELETE /api/seller/stores/:storeId/coupons/:couponId` | Store-scoped coupon lookup | `COUPON_STATUS_MANAGE` | none | coupon DTO and `Coupon deactivated.` message | Wire now as archive |
| Hard delete | none | none | n/a | n/a | n/a | n/a | Keep disabled |

## UI Wiring

| UI action | Status | Notes |
|---|---|---|
| Create Coupon drawer | Enabled | Validates required fields, discount value, minimum spend, and date range. |
| Edit Coupon | Enabled | Opens the same drawer with existing row values. |
| Activate/deactivate | Enabled | Calls the status PATCH helper and invalidates coupon queries. |
| Archive | Enabled as deactivate | Calls backend DELETE route, which deactivates the coupon. |
| Hard delete | Not exposed | Avoids destructive lifecycle ambiguity. |
| Duplicate/import/export/banner upload | Disabled | Pending separate API and UX review. |

## Permission Mapping
- `COUPON_CREATE` maps to backend `COUPON_CREATE`.
- `COUPON_UPDATE` maps to backend `COUPON_EDIT`.
- `COUPON_STATUS_MANAGE` maps to backend `COUPON_STATUS_MANAGE`.
- `COUPON_DELETE` aliases to backend `COUPON_STATUS_MANAGE` and is used only for archive/deactivate.

## Files Changed
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/api/seller2026/coupons.mutations.ts`
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026Coupons.ts`
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `system_map.md`

## Verification
- `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS.
- `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx`: PASS with one warning that `seller2026RouteConfig.jsx` is ignored by the current ESLint config.
- `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`: PASS.

## Smoke Result
- Preview and live Seller 2026 routes remained renderable.
- Coupon lifecycle smoke created a unique `S26SMOKE*` coupon, edited it, deactivated it, reactivated it, and archived it.
- Observed coupon API statuses included `201` for create and `200` for list/update/archive.
- No fatal console errors were reported by the smoke runner.

## Remaining Disabled Work
- Coupon hard delete.
- Coupon duplicate.
- Coupon import/export.
- Coupon banner upload picker.
- Coupon storefront exposure policy changes.
