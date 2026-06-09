# Seller Workspace 2026 Orders Adoption Report

## 1. Task Title
`SELLER-WORKSPACE-2026-PROD-ADOPT-ORDERS-12`

## 2. Scope
Adopt Seller Workspace 2026 Orders list/detail on canonical seller routes behind existing flags, using live store-scoped seller order APIs. Backend schema, auth, permissions, payment governance, Admin payment audit, Client checkout, shipping governance, and legacy Orders pages were not changed.

## 3. Worktree Status Note
Initial `git status --short` showed many existing modified/untracked Seller 2026 files and reports from previous tasks. This task did not revert unrelated work. A checkpoint commit is recommended before/after this task:
`feat(seller): adopt seller workspace 2026 coupons behind flags`

Orders-task files changed are listed below.

## 4. Files Read
- `system_map.md`
- `reports/seller-workspace-2026-coupons-adoption-20260608-report.md`
- `reports/seller-workspace-2026-attribute-values-adoption-20260608-report.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerOrdersPage.jsx`
- `client/src/pages/seller/SellerOrderDetailPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/orders.adapter.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/orders.mutations.ts`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/hooks/seller2026/useSeller2026SuborderDetail.ts`
- `client/src/api/sellerOrders.ts`
- `server/src/routes/seller.orders.ts`
- Seller 2026 smoke scripts for coupons, attribute values, attributes, categories, authoring, product detail, catalog, dashboard, and notifications.

## 5. Files Changed
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/orders.mutations.ts`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `scripts/seller2026-orders-adoption-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-orders-adoption-20260608-report.md`

## 6. Route Adoption Behavior
- Flags off: `/seller/stores/:storeSlug/orders` renders `SellerOrdersPage`.
- Flags off: `/seller/stores/:storeSlug/orders/:suborderId` renders `SellerOrderDetailPage`.
- Global flag on and orders flag on: routes render `Seller2026LiveOrdersPage` and `Seller2026LiveSuborderDetailPage`.
- Routes stay under `SellerLayout`, using seller session/store context.
- Detail route uses `suborderId`.

## 7. Endpoint Audit
- List: `GET /api/seller/stores/:storeId/suborders`, permission `ORDER_VIEW`, store-scoped by `requireSellerStoreAccess`.
- Detail: `GET /api/seller/stores/:storeId/suborders/:suborderId`, permission `ORDER_VIEW`, suborder scoped to store.
- Fulfillment: `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment`, permission `ORDER_FULFILLMENT_MANAGE`.
- Bulk delete exists in backend, but Seller 2026 UI does not expose it.
- Payment status mutation is not exposed from Seller 2026 Orders.

## 8. Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED`

## 9. APIs Used
- `getSellerSuborders`
- `getSellerSuborderDetail`
- `updateSellerSuborderFulfillment`
- `updateSeller2026OrderFulfillment`
- `useSeller2026Orders`
- `useSeller2026SuborderDetail`

## 10. Orders List Data Contract
Rows normalize `id`, `suborderId`, `orderId`, `orderNumber`, `customerName`, `customerEmail`, `itemsCount`, `items`, `totalAmount`, `currency`, `paymentStatus`, `fulfillmentStatus`, `shippingStatus`, `deliveryMethod`, `trackingNumber`, `createdAt`, `updatedAt`, `paidAt`, `allowedActions`, `canFulfill`, and canonical detail href.

Summary normalizes `total`, `pending`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, `paymentPending`, and `needsAttention`.

## 11. Order Detail Data Contract
Detail normalizes `suborder`, `customer`, `shipping`, `items`, `totals`, `payment`, `timeline`, `notes`, `allowedActions`, `canFulfill`, `createdAt`, and `updatedAt`.

Safe fallbacks include `Order`, `Customer`, `IDR`, `0`, `[]`, `Needs review`, `Recently`, `No shipping address available.`, `No payment proof available.`, and `No tracking number yet.`

## 12. Fulfillment Mutation Decision
Enabled only for `MARK_PROCESSING` from Seller 2026 Orders after smoke validation. `MARK_SHIPPED`, `MARK_DELIVERED`, and tracking updates remain disabled pending payload-specific review.

## 13. Whitelisted Payload
Seller 2026 fulfillment smoke verified one payload:
- `{ action: "MARK_PROCESSING" }`

The helper accepts only reviewed action codes and sanitizes optional shipment fields, but UI does not send tracking fields in this task.

## 14. Blocked Payload Fields
Smoke guards checked no outgoing order mutation payload contained:
- `storeId`
- `orderId`
- `paymentStatus`
- `paid`
- `refunded`
- `cancelledByAdmin`
- `ownerId`
- `vendorId`
- raw permission fields
- arbitrary `metadata`

## 15. Permission Behavior
Owner can view list/detail and run `MARK_PROCESSING` only when backend allowed actions expose it. Role-limited member can view permitted order lanes; smoke observed no member mutation request.

## 16. Cross-Store Behavior
Owner of `tp-preneurs-demo-store` opening `other-demo-store` Orders list/detail receives forbidden-safe UI. Smoke confirmed no cross-store mutation request.

## 17. Payment Boundary
Payment status is displayed read-only on list/detail. No payment approve/reject/update controls are exposed in Orders.

## 18. Fixture/Reset Strategy
Smoke uses `ensureSeller2026AuthSmokeFixture()`, then resets a deterministic suborder to `PAID` + `UNFULFILLED` before `MARK_PROCESSING`. Fixture data can be reset by rerunning the smoke.

## 19. Route Link Safety
Live links use:
- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`

No canonical live link points to `/seller-2026`.

## 20. Preview Behavior
`/seller-2026/orders` and `/seller-2026/orders/:suborderId` remain available. Preview can continue using mock/preview data.

## 21. Disabled Actions
- Parent order mutation.
- Payment status mutation.
- Refund/dispute.
- Bulk fulfillment.
- Bulk delete.
- Order delete.
- Print/download label.
- Tracking update.
- `MARK_SHIPPED`.
- `MARK_DELIVERED`.

## 22. UI States
Orders list/detail include loading, error, empty/not-found-safe, permission-safe, mutation feedback, summary cards, search/filter controls, mobile-safe table wrapping, and English-only touched copy.

## 23. Smoke Results
- `pnpm.cmd exec tsx scripts/seller2026-orders-adoption-smoke.ts`: PASS.
- Flags off list/detail: PASS.
- Flags on list/detail: PASS.
- Owner list/detail: PASS.
- Fulfillment: PASS for `MARK_PROCESSING`.
- Role-limited member: PASS.
- Cross-store guard: PASS.
- Payment read-only boundary: PASS.
- Mutation request guard: PASS, one fulfillment PATCH, no payment/delete/bulk mutation.
- Preview: PASS.
- Regression routes: PASS for Coupons, Attribute Values, Attributes, Categories, Authoring, Product Detail, Catalog, Dashboard, Notifications, Admin, Client, and Checkout boundary.
- `pnpm.cmd exec tsx scripts/seller2026-coupons-adoption-smoke.ts`: PASS.
- `pnpm.cmd exec tsx scripts/seller2026-attribute-values-adoption-smoke.ts`: PASS.

## 24. Typecheck/Build/Lint Results
- `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS with existing Vite chunk-size warnings.
- `pnpm.cmd -F server build`: PASS.
- Targeted ESLint: PASS with existing warnings that `.jsx` files are ignored by current config.
- `git diff --check`: PASS with existing CRLF warning for `client/src/features/seller2026/Seller2026DesignSystem.css`.

## 25. Bugs Fixed
- Seller 2026 Orders list now exposes production-grade summary cards and separate payment/fulfillment statuses.
- Order detail now makes payment read-only boundary visible.
- Seller 2026 fulfillment mutation helper no longer allows unreviewed failed/returned/cancel shipment actions.
- `MARK_SHIPPED` and `MARK_DELIVERED` are disabled until tracking/delivery payload smoke is approved.
- Smoke coverage now verifies flags off/on, owner/member/cross-store, preview, and mutation request guards.

## 26. Known Limitations
- `MARK_SHIPPED` and `MARK_DELIVERED` are intentionally disabled pending tracking/delivery payload review.
- Tracking fields are display/read-only in Seller 2026 Orders for this task.
- Full older Attributes and Categories mutation smokes have known polling flakes; route regressions and required Orders/Coupons/Attribute Values smokes PASS.
- Worktree contains unrelated dirty/untracked files from previous Seller 2026 tasks.

## 27. Rollback Notes
Turn off `VITE_SELLER_WORKSPACE_2026_ENABLED` or `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED` to render legacy `SellerOrdersPage` and `SellerOrderDetailPage`. No backend rollback is required.

## 28. Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-REVIEW-13`
