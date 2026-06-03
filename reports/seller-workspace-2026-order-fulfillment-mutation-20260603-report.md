# Seller Workspace 2026 Order Fulfillment Mutation Report

## Task
SELLER-2026-ORDER-FULFILLMENT-MUTATION-08

## Commit
- Commit hash recorded in final response after git commit.

## Files Read
- `system_map.md`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `reports/seller-workspace-2026-notification-mutation-20260603-report.md`
- `reports/seller-workspace-2026-add-product-cta-fix-20260603-report.md`
- `reports/seller-workspace-2026-coupon-lifecycle-mutation-20260603-report.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `client/src/api/sellerOrders.ts`
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/hooks/seller2026/useSeller2026SuborderDetail.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`
- `server/src/routes/seller.orders.ts`
- `server/src/middleware/requireSellerStoreAccess.ts`
- `server/src/services/seller/permissionMap.ts`

## Files Modified
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/orders.mutations.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026Orders.ts`
- `client/src/hooks/seller2026/useSeller2026SuborderDetail.ts`
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `system_map.md`
- `reports/seller-workspace-2026-order-fulfillment-mutation-20260603-report.md`

## Order Fulfillment Contract

| Action | Frontend API | Backend Route | Store Scope | Permission | Payload | Response | Decision |
|---|---|---|---|---|---|---|---|
| List suborders | `getSellerSuborders` | `GET /api/seller/stores/:storeId/suborders` | `requireSellerStoreAccess`, seller store context, list query scoped to store | `ORDER_VIEW` | query params only | `{ items, pagination, governance }` | READ_LIVE |
| Detail suborder | `getSellerSuborderDetail` | `GET /api/seller/stores/:storeId/suborders/:suborderId` | lookup by `{ id: suborderId, storeId }` | `ORDER_VIEW` | none | serialized seller detail | READ_LIVE |
| Mark packed | `updateSeller2026OrderFulfillment` | `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment` | lookup by `{ id: suborderId, storeId }` | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | `{ action: "MARK_PROCESSING" }` | transition, audit id, refreshed suborder | WIRE_NOW |
| Mark shipped | `updateSeller2026OrderFulfillment` | same | lookup by `{ id: suborderId, storeId }` | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | `{ action: "MARK_SHIPPED", shippingFee? }` | transition, shipment sync, refreshed suborder | WIRE_NOW |
| Mark delivered | `updateSeller2026OrderFulfillment` | same | lookup by `{ id: suborderId, storeId }` | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | `{ action: "MARK_DELIVERED" }` | transition, audit id, refreshed suborder | WIRE_WHEN_GOVERNANCE_EXPOSES |
| Failed delivery / returned / cancel shipment | Existing backend action | same | store-scoped | `ORDER_FULFILLMENT_MANAGE` | action-specific | refreshed suborder | KEEP_DISABLED pending UX/policy |
| Bulk delete | `bulkDeleteSellerSuborders` | `POST /api/seller/stores/:storeId/suborders/bulk-delete` | store-scoped deletion guard | `ORDER_VIEW`, `ORDER_FULFILLMENT_MANAGE` | ids | deletion result | KEEP_DISABLED destructive flow |
| Print receipt / label | none confirmed | none wired | n/a | n/a | n/a | n/a | NEEDS_BACKEND_REVIEW |
| Payment status update | none from order page | n/a | n/a | n/a | n/a | n/a | KEEP_DISABLED |

## State Transition Map

| Current Status | Allowed Seller Action | Target Status | Notes |
|---|---|---|---|
| `UNFULFILLED` | Mark as Packed | `PROCESSING` | Uses `MARK_PROCESSING` when backend governance exposes it. |
| `PROCESSING` | Mark as Shipped | `SHIPPED` | Tracking remains disabled until persisted shipment tracking is available. |
| `SHIPPED` | Mark Delivered | `DELIVERED` | Enabled only when backend governance exposes it. |
| `DELIVERED` | none | n/a | Final seller fulfillment state. |
| `CANCELLED` | none | n/a | Cancellation flow not opened in Seller 2026. |

## UI Wiring

| UI Area | Behavior | Status | Notes |
|---|---|---|---|
| Orders list | Shows first backend-governed eligible action; shipping actions use detail view. | Wired | List refetches after successful mutation. |
| Order detail | Shows fulfillment form and status buttons. | Wired | Payment info remains read-only. |
| Tracking form | Visible but disabled. | Disabled pending API | Current smoke read model reports legacy fallback/no persisted shipment tracking. |
| Print Receipt | Disabled. | Kept disabled | Needs endpoint review. |
| Bulk Action | Disabled. | Kept disabled | Existing bulk delete is destructive and not exposed. |

## Mutations Wired

| Action | Status | Test Result | Notes |
|---|---|---|---|
| Mark as Packed | Wired | Covered when fixture/status exposes `MARK_PROCESSING` | Backend-governed. |
| Mark as Shipped | Wired | Smoke target | Uses `MARK_SHIPPED`; tracking persistence remains disabled. |
| Mark Delivered | Wired when exposed | Not primary smoke transition | Backend-governed. |

## Mutations Kept Disabled

| Action | Reason | Next Requirement |
|---|---|---|
| Payment status mutation | Order page must not mutate payment lifecycle. | Separate payment review task. |
| Payment approve/reject | Backend/payment audit lifecycle not part of this task. | Payment mutation review. |
| Tracking/resi persistence | Current smoke fixture/read model remains legacy fallback with no persisted shipment record. | Persisted shipment tracking rollout. |
| Bulk fulfillment/delete | Bulk delete is destructive and bulk fulfillment workflow is not clear. | Separate UX and fixture review. |
| Print receipt/label | No confirmed Seller 2026 store-scoped print endpoint. | Backend/API contract review. |
| Cancel/refund/return/dispute | Policy and state lifecycle need review. | Dedicated operations lifecycle task. |

## Permission / Ownership

| Scenario | Expected | Result | Notes |
|---|---|---|---|
| Store owner updates own suborder | Allowed | Smoke target | Requires `ORDER_FULFILLMENT_MANAGE`. |
| Order manager views orders | Allowed | Existing smoke coverage | Role has `ORDER_VIEW` and `ORDER_FULFILLMENT_MANAGE`. |
| Cross-store owner accesses other store | Forbidden | Existing smoke coverage | Guard remains unchanged. |
| User without fulfillment permission | Button disabled | UI gated | Backend remains source of truth. |

## Fixture / Smoke Mutation

| Mutation | Result | Rollback/Idempotency | Notes |
|---|---|---|---|
| Mark smoke order shipped | PASS | Fixture resets `SELLER2026-PAID-S1` to `PROCESSING` and clears shipment/tracking before run. | Smoke verifies `SHIPPED` in detail and list. |

## Bugs Found
- Detail mutation hook originally accepted a raw payload while the workspace sent `{ suborderId, payload }`, causing `INVALID_FULFILLMENT_ACTION`.
- Coupon smoke names were not unique enough and caused strict locator collisions across repeated runs.
- Smoke fixture initially omitted `fulfillmentSuborderId` from the returned fixture object.

## Fixes Applied
- Added `client/src/api/seller2026/orders.mutations.ts` payload whitelist.
- Standardized order list/detail fulfillment mutation signatures.
- Added backend-governed `fulfillmentActions` to Seller 2026 order adapters.
- Added disabled tracking UI state with pending backend shipment rollout copy.
- Made coupon smoke assertions idempotent and row-scoped.
- Added deterministic smoke fixture reset for shipments/tracking.

## Testing
- Live smoke: PASS, `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`.
- Typecheck: PASS, `pnpm.cmd -F client exec tsc -b`.
- Build: PASS, `pnpm.cmd -F client build`.
- Seller 2026 lint: PASS with one existing ignored-config warning for `seller2026RouteConfig.jsx`.
- Full lint: not run; repo-wide lint debt remains out of scope.

## Risks Remaining
- Tracking/resi is disabled because no persisted shipment tracking was available in the smoke read model.
- Print label/receipt remains disabled.
- Failed delivery, return, and cancel shipment remain disabled pending operations policy.

## Recommended Next Task
- Payment review approve/reject mutation audit, or a focused fulfillment exception lifecycle task for failed delivery/return/cancel shipment.
