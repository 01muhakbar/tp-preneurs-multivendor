# Seller Workspace 2026 Coupon Lifecycle Sync Report

## Status
PASS

## Task
SELLER-WORKSPACE-2026-COUPON-LIFECYCLE-SYNC-31

## Observed
- Seller Workspace 2026 canonical coupons route already uses live store-scoped seller coupon APIs.
- Backend seller coupon routes already enforce `scopeType: STORE`, active store ownership, and route-level seller permissions.
- Backend `DELETE /api/seller/stores/:storeId/coupons/:couponId` is not a hard delete; it updates `active=false`.
- Seller 2026 archive UI was still keyed through the delete permission alias path instead of the backend's real `COUPON_STATUS_MANAGE` lifecycle permission.
- Seller 2026 mutation payload builder still accepted `bannerImageUrl`, while banner/media upload remains outside the validated storage contract for this task.

## Reused Patterns
- React Query live hook pattern in `useSeller2026Coupons`.
- Existing seller coupon API layer in `client/src/api/sellerCoupons.ts`.
- Existing seller 2026 mutation wrapper in `runSeller2026Mutation`.
- Existing Seller 2026 shell/table/form states and disabled action copy.
- Existing smoke fixture from `scripts/seller2026-auth-fixture-live-smoke.ts`.

## Files Read
- `client/src/App.jsx`
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026Coupons.ts`
- `client/src/api/sellerCoupons.ts`
- `client/src/api/seller2026/coupons.mutations.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/pages/seller2026/seller2026PagePermissions.js`
- `client/src/pages/seller/SellerCouponsPage.jsx`
- `server/src/routes/seller.coupons.ts`
- `server/src/routes/store.coupons.ts`
- `server/src/routes/admin.coupons.ts`
- `server/src/services/seller/permissionMap.ts`
- `server/src/middleware/requireSellerStoreAccess.ts`
- `scripts/seller2026-coupons-adoption-smoke.ts`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `system_map.md`

## Files Changed
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/seller2026/coupons.mutations.ts`
- `scripts/seller2026-coupon-lifecycle-sync-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-coupon-lifecycle-sync-20260609-report.md`

## Changes
- Seller archive permission now follows the real backend lifecycle permission: `COUPON_STATUS_MANAGE`.
- Archive tooltip now references status lifecycle governance instead of delete governance.
- Seller 2026 coupon payload builder no longer emits `bannerImageUrl`.
- Added dedicated lifecycle smoke for create, update, activate, deactivate, archive-as-deactivate, no-hard-delete, payload whitelist, member guard, cross-store guard, and store-scoped list boundary.
- Updated `system_map.md` with the 2026-06-09 coupon lifecycle sync status.

## Synchronization
- Admin Workspace: unchanged. Admin/platform coupon governance and mutation lanes were not modified.
- Seller Workspace: synced archive permission with backend, kept duplicate/bulk/banner upload disabled, kept create/edit/status/archive on existing seller APIs.
- Client/storefront: unchanged. Checkout coupon validation and public storefront coupon behavior were not modified.
- Backend: unchanged. Existing routes, schema, auth middleware, and permission map were audited and reused.

## QA
- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client build`: PASS, with existing Vite large chunk warning only.
- `pnpm.cmd -F server build`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-coupon-lifecycle-sync-smoke.ts`: PASS
- `git diff --check`: PASS

## Smoke Result
`SELLER_2026_COUPON_LIFECYCLE_SYNC_PASS`

Covered:
- Create coupon through seller store route.
- Update coupon through seller store route.
- Deactivate and reactivate through `PATCH { active }`.
- Archive through existing `DELETE`, verified as `active=false`.
- Verified coupon record remains in DB after archive.
- Verified seller list returns only current store-scoped coupons.
- Verified member without coupon permission cannot create.
- Verified owner cannot access another store's coupons.
- Verified built payload excludes forbidden fields.

## Guardrails
- No database schema change.
- No backend API payload contract change.
- No auth/session/permission middleware change.
- No payment/order/shipping change.
- No checkout validation change.
- No hard delete exposed.
- No duplicate coupon action enabled.
- No platform/admin coupon mutation from Seller Workspace.
- No banner/media upload enabled.
- Legacy Seller coupon page and preview routes remain intact.

## Remaining Risk
- The disposable smoke coupon remains archived/inactive for auditability instead of being hard-deleted.
- Existing Vite build still reports large chunk warnings unrelated to this task.
- Seller 2026 preview coupon adapter remains preview-only and was not expanded for lifecycle mutation.

## Next Recommendation
- Add a small UI regression smoke that opens the live Seller 2026 coupons page and confirms Archive is enabled for users with `COUPON_STATUS_MANAGE`.
- Add admin read-only verification that seller-created store coupons remain visible in the correct admin governance lane without adding seller-to-admin mutation coupling.
