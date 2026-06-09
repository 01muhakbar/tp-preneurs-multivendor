# Seller Workspace 2026 Coupons Adoption Report

Task ID: `SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-11`

## 1. Task Title

`SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-11`

## 2. Scope

Adopted Seller Workspace 2026 Coupons on `/seller/stores/:storeSlug/catalog/coupons` behind existing flags, using live store-scoped seller coupon APIs. Backend schema, auth middleware, permission backend, Admin Workspace, Client Storefront, checkout coupon validation, order, payment, shipping, and legacy Coupons page were not changed.

## 3. Files Read

- `system_map.md`
- `reports/seller-workspace-2026-attribute-values-adoption-20260608-report.md`
- `reports/seller-workspace-2026-attributes-adoption-20260608-report.md`
- `reports/seller-workspace-2026-categories-mutation-hardening-20260608-report.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerCouponsPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/sellerCoupons.ts`
- `client/src/api/seller2026/coupons.mutations.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Coupons.ts`
- `server/src/routes/seller.coupons.ts`
- Seller 2026 smoke scripts for attribute values, attributes, categories, authoring, product detail, catalog, dashboard, and notifications.
- Checkout coupon boundary files found through coupon validation search; no checkout file was changed.

## 4. Files Changed

- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Coupons.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-coupons-adoption-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-coupons-adoption-20260608-report.md`

## 5. Route Adoption Behavior

- Flags off: `/seller/stores/:storeSlug/catalog/coupons` renders legacy `SellerCouponsPage`.
- Global flag on and coupons flag off: route renders legacy `SellerCouponsPage`.
- Global flag on and coupons flag on: route renders `Seller2026LiveCouponsPage`.
- Legacy redirect `/seller/stores/:storeSlug/coupons` redirects to `/seller/stores/:storeSlug/catalog/coupons`.
- Canonical route is under `SellerLayout`, using seller session/store context.

## 6. Endpoint Audit

- List: `GET /api/seller/stores/:storeId/coupons`, permission `COUPON_VIEW`, store-scoped by backend `requireSellerStoreAccess`.
- Create: `POST /api/seller/stores/:storeId/coupons`, permission `COUPON_CREATE`, payload schema accepts `code`, `campaignName`, `discountType`, `amount`, `minSpend`, `active`, `bannerImageUrl`, `startsAt`, `expiresAt`.
- Update: `PATCH /api/seller/stores/:storeId/coupons/:couponId`, permission `COUPON_EDIT`, store-scoped lookup with `scopeType: STORE`.
- Activate/deactivate: `PATCH /api/seller/stores/:storeId/coupons/:couponId` with `active`, additionally checks `COUPON_STATUS_MANAGE`.
- Archive/deactivate: `DELETE /api/seller/stores/:storeId/coupons/:couponId`, permission `COUPON_STATUS_MANAGE`, backend updates `active=false` and returns `Coupon deactivated.`
- Banner upload: client helper exists but posts to generic `/upload`; not enabled because store-scoped storage validation is not proven.
- Duplicate/bulk: no safe Seller 2026 endpoint adopted.
- Platform/admin coupon mutation: seller route only reads/finds `scopeType: STORE` and `storeId`, so platform/admin coupons are outside seller mutation lane.

## 7. Feature Flags

- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED`

## 8. APIs Used

- `listSellerCoupons`
- `createSellerCoupon`
- `updateSellerCoupon`
- `deleteSellerCoupon`
- `createSeller2026Coupon`
- `updateSeller2026Coupon`
- `setSeller2026CouponStatus`
- `archiveSeller2026Coupon`
- `useSeller2026Coupons`
- `adaptSeller2026Coupons`

## 9. Coupons Data Contract

Adapter normalizes coupon rows to `id`, `code`, `title`, `description`, `discountType`, `discountValue`, `currency`, `minimumOrderAmount`, `maximumDiscountAmount`, `usageLimit`, `usageCount`, `perCustomerLimit`, `startsAt`, `expiresAt`, `status`, `isActive`, `isExpired`, `isArchived`, `scope`, `storeId`, `isStoreScoped`, `isPlatformCoupon`, `createdAt`, `updatedAt`, and `canonicalHref`.

Summary normalizes `total`, `active`, `inactive`, `expired`, `scheduled`, `archived`, `needsAttention`, `redemptions`, and `discountGiven`.

Safe fallback:
- Missing code: `NO-CODE`.
- Missing title: code or `Untitled coupon`.
- Missing description: `No description available.`
- Missing discount type: `percent` display, backend create/update requires valid form value.
- Missing discount value: `0`.
- Missing currency: `IDR`.
- Invalid date: `Not set`.
- Unknown status: `inactive` unless backend status says active/scheduled/expired.
- Missing array: `[]`.

## 10. Whitelisted Payload

Create/update payload is built through `buildSeller2026CouponPayload` and only sends:
- `code`
- `campaignName`
- `discountType`
- `amount`
- `minSpend`
- `active`
- `startsAt`
- `expiresAt`
- `bannerImageUrl` only if already supplied by trusted state; UI upload stays disabled.

## 11. Blocked Payload Fields

Smoke verified create/update payloads did not send:
- `storeId`
- `ownerId`
- `vendorId`
- `createdBy`
- `updatedBy`
- `platformCoupon`
- `isPlatform`
- `usageCount`
- checkout validation override
- raw permission fields
- arbitrary `metadata`

## 12. Create Coupon Flow

Owner with `COUPON_CREATE` can open `Add Coupon`, fill code, title, discount type, discount value, minimum order, optional dates, and active state. Submit calls the existing store-scoped create endpoint. On success, modal closes, list refetches, and `Coupon created.` is shown.

## 13. Update Coupon Flow

Owner with `COUPON_EDIT` can update store-scoped coupons. Smoke updates title and discount value, validates refetch, and confirms the row shows the updated values.

## 14. Activate/Deactivate Decision

Enabled and smoke-tested. The existing PATCH endpoint supports `active` with `COUPON_STATUS_MANAGE`; smoke confirms deactivate and activate both refetch into expected row state.

## 15. Archive/Delete Decision

Enabled as `Archive`, not hard delete. Backend `DELETE` deactivates the coupon by updating `active=false`; smoke confirms archive cleanup leaves the disposable coupon inactive. Hard delete remains disabled.

## 16. Banner/Image Upload Guard

Disabled. Reason shown: `Coupon banner upload is disabled until storage validation is complete.` Smoke confirms the button is disabled and no upload request is sent.

## 17. Permission Behavior

Owner can create/update/status/archive when permissions allow. Role-limited member renders safely and smoke confirms no mutation request is sent.

## 18. Cross-Store Behavior

Owner of `tp-preneurs-demo-store` opening `other-demo-store` receives forbidden-safe UI. Smoke confirms no cross-store coupon mutation succeeds.

## 19. Platform/Admin Coupon Guard

PASS by API boundary. The seller coupon API lists and mutates only `scopeType: STORE` coupons for the active seller store. Platform/admin coupons are not exposed on the canonical seller coupons route.

## 20. Cleanup Fixture Strategy

Smoke creates `S26COUPON${timestamp}`, updates it, toggles inactive/active, then archives it through the backend delete route that deactivates. Cleanup state is `ARCHIVE_AS_DEACTIVATE`.

## 21. Checkout Validation Boundary

No checkout coupon validation files were changed. Smoke opens `/checkout` and confirms no crash.

## 22. Route Link Safety

Live Seller 2026 Coupons UI links use canonical `/seller/stores/:storeSlug/*` routes. No canonical live link points to `/seller-2026`.

## 23. Preview Behavior

`/seller-2026/catalog/coupons` remains available and smoke PASS. Preview can continue to use mock/preview data.

## 24. Disabled Actions

- Hard delete.
- Duplicate coupon.
- Bulk coupon actions.
- Coupon banner/image upload.
- Platform/admin coupon mutation from seller route.
- Checkout validation changes.
- Coupon metadata fields that backend does not currently persist from Seller 2026 UI.

## 25. UI States

Live Coupons includes loading, error, empty, mutation pending, success/error, permission-safe controls, disabled action reasons, summary cards, live data table, mobile-safe existing Seller 2026 responsive wrappers, and English-only copy for touched surfaces.

## 26. Smoke Results

`pnpm.cmd exec tsx scripts/seller2026-coupons-adoption-smoke.ts`: PASS.

- Flags off runtime: PASS.
- Flags on runtime: PASS.
- Legacy redirect: PASS.
- Owner create: PASS.
- Owner update: PASS.
- Owner activate/deactivate: PASS.
- Owner archive/deactivate: PASS.
- Payload guard: PASS.
- Banner upload guard: PASS.
- Role-limited member: PASS.
- Cross-store guard: PASS.
- Platform/admin guard: PASS by seller API boundary.
- Cleanup fixture: PASS as archive/deactivate.
- Preview: PASS.
- Attribute Values regression: PASS through `pnpm.cmd exec tsx scripts/seller2026-attribute-values-adoption-smoke.ts`.
- Attributes regression: PASS.
- Categories regression: PASS.
- Authoring regression: PASS.
- Product Detail regression: PASS.
- Catalog regression: PASS.
- Dashboard regression: PASS.
- Notifications regression: PASS.
- Admin regression: PASS.
- Client regression: PASS.
- Checkout boundary: PASS.

## 27. Typecheck/Build/Lint Results

- `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS with existing Vite chunk-size warnings.
- `pnpm.cmd -F server build`: PASS.
- Targeted lint: PASS with existing config warnings for ignored `.jsx` files.
- `git diff --check`: PASS with existing CRLF warning for `client/src/features/seller2026/Seller2026DesignSystem.css`.

## 28. Bugs Fixed

- Coupons adapter now exposes production-grade normalized fields, summary counts, scope/attribution flags, and canonical metadata.
- Coupons hook now filters by code/title/description and tracks pending mutation IDs per row.
- Seller 2026 Coupons UI now shows live marker, richer summary cards, disabled reason guards, archive-as-deactivate, banner upload guard, and payload-safe form behavior.
- Success message remains visible after create/update modal closes.

## 29. Known Limitations

- Banner upload remains disabled until store-scoped storage validation is approved and smoke-tested.
- Duplicate and bulk coupon actions remain disabled pending API/governance review.
- Description, usage limit, max discount, and per-customer limit are display-normalized but not persisted from Seller 2026 UI because existing seller coupon write schema does not safely support those fields.
- Known old smoke flakes remain outside this task: Attributes publish wait and full Categories status polling. Coupons smoke route regressions PASS.

## 30. Rollback Notes

Turn off `VITE_SELLER_WORKSPACE_2026_ENABLED` or `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED` to render legacy `SellerCouponsPage` on the canonical coupons route. No backend rollback is required.

## 31. Next Recommended Task

`SELLER-WORKSPACE-2026-PROD-ADOPT-ORDERS-12`
