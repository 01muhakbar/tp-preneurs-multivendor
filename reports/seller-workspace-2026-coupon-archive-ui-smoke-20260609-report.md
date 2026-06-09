# Seller Workspace 2026 Coupon Archive UI Smoke Report

## Task ID
`SELLER-WORKSPACE-2026-COUPON-ARCHIVE-UI-SMOKE-31B`

## Status
`COUPON_ARCHIVE_UI_PERMISSION_SMOKE_PASS`

## Files Read
- `client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/seller2026/coupons.mutations.ts`
- `scripts/seller2026-coupon-lifecycle-sync-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-coupon-lifecycle-sync-20260609-report.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `server/src/services/seller/resolveSellerAccess.ts`
- `server/src/models/StoreMember.ts`
- `server/src/models/StoreRole.ts`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`

## Files Changed
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-coupon-archive-ui-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-coupon-archive-ui-smoke-20260609-report.md`

## Smoke Scenarios
| Scenario | Result | Notes |
|---|---|---|
| Owner with `COUPON_STATUS_MANAGE` sees Archive enabled | PASS | Owner fixture saw enabled Archive on disposable store coupon. |
| Archive confirmation modal appears | PASS | Modal copy: `Archive coupon?` and checkout/history safety text appeared before mutation. |
| Cancel keeps coupon unchanged | PASS | Cancel closed modal and DB coupon stayed `active=true`. |
| Confirm archive soft-deactivates coupon | PASS | Confirm sent one `DELETE` request and DB coupon remained present with `active=false`. |
| Hard delete is not exposed | PASS | No `Hard Delete` button was found. |
| Duplicate remains disabled/not exposed | PASS | Duplicate button stayed disabled. |
| Member without permission cannot archive | PASS | Member route rendered seller shell; Archive action was hidden because member lacks coupon permissions. |
| Platform/admin coupon action blocked | SKIPPED | Seller coupon API does not expose platform coupon rows to Seller Workspace; smoke output: `SKIPPED_PLATFORM_COUPON_NOT_EXPOSED_TO_SELLER_LIST`. |

## Validation
- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client build`: PASS, with existing Vite large chunk warning only.
- `pnpm.cmd -F server build`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-coupon-archive-ui-smoke.ts`: PASS
- `git diff --check`: PASS

## Guardrails Confirmed
- No backend changes
- No schema changes
- No auth/permission model changes
- No checkout validation changes
- No hard delete
- No duplicate coupon
- No platform/admin coupon mutation
- Archive remains soft deactivate

## Known Issues
- Platform/admin coupon row is not available inside the Seller coupon list by design, so platform action-state testing is skipped at UI row level.
- The smoke creates a disposable coupon and leaves it inactive for auditability.
- Existing Vite large chunk warning remains unrelated to this task.

## Next
1. `SELLER-WORKSPACE-2026-PRODUCT-AUTHORING-SYNC-32`
2. `SELLER-WORKSPACE-2026-ORDER-FULFILLMENT-SYNC-33`
