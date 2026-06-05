# Seller Workspace 2026 Payment Review Mutation Report

## Task
SELLER-2026-PAYMENT-REVIEW-MUTATION-09

## Commit
- Commit hash recorded in final response after git commit.

## Files Read
- `system_map.md`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `reports/seller-workspace-2026-notification-mutation-20260603-report.md`
- `reports/seller-workspace-2026-add-product-cta-fix-20260603-report.md`
- `reports/seller-workspace-2026-coupon-lifecycle-mutation-20260603-report.md`
- `reports/seller-workspace-2026-order-fulfillment-mutation-20260603-report.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `client/src/api/sellerPayments.ts`
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/hooks/seller2026/useSeller2026PaymentReview.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LivePaymentReviewPage.jsx`
- `server/src/routes/seller.payments.ts`
- `server/src/routes/seller.orders.ts`
- `server/src/middleware/requireSellerStoreAccess.ts`
- `server/src/services/seller/permissionMap.ts`
- `server/src/services/seller/resolveSellerAccess.ts`

## Files Modified
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/payments.mutations.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026PaymentReview.ts`
- `client/src/pages/seller2026/Seller2026LivePaymentReviewPage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `system_map.md`
- `reports/seller-workspace-2026-payment-review-mutation-20260603-report.md`

## Payment Review Contract

| Action | Frontend API | Backend Route | Store Scope | Permission | Payload | Response | Decision |
|---|---|---|---|---|---|---|---|
| List payment reviews | `getSellerPaymentReviewSuborders` | `GET /api/seller/stores/:storeId/payment-review/suborders` | `requireSellerStoreAccess`, list scoped to seller store | `ORDER_VIEW`, `PAYMENT_STATUS_VIEW` | query `paymentStatus` | `{ store, filters, items, governance }` | READ_LIVE |
| Approve payment | `approveSeller2026PaymentReview` | `PATCH /api/seller/stores/:storeId/payments/:paymentId/review` | Route store id must match payment/suborder store | View permissions plus owner/admin mutation governance | `{ action: "APPROVE", note? }` | refreshed seller suborder payment view | WIRE_NOW |
| Reject payment | `rejectSeller2026PaymentReview` | same | Route store id must match payment/suborder store | View permissions plus owner/admin mutation governance | `{ action: "REJECT", note }` | refreshed seller suborder payment view | WIRE_NOW |
| Request clarification | none confirmed | none confirmed | n/a | n/a | n/a | n/a | NEEDS_BACKEND_REVIEW |
| Refund/dispute/settlement | none wired | admin/payment governance only | n/a | n/a | n/a | n/a | KEEP_DISABLED |

## Payment Governance Boundary

| Area | Seller 2026 Allowed? | Admin Only? | Notes |
|---|---|---|---|
| Approve pending proof | Yes, owner/admin only | No | Backend requires pending payment and latest pending proof. |
| Reject pending proof | Yes, owner/admin only | No | Seller 2026 requires reason and backend stores it as review note. |
| Request clarification | No | Needs design | No seller endpoint/lifecycle was confirmed. |
| Refund/dispute/settlement | No | Yes | Not opened in this task. |
| Payment profile approval | No | Yes | Payment profile governance remains separate. |
| Order page payment mutation | No | n/a | Order pages remain read-only for payment status. |

## UI Wiring

| UI Area | Behavior | Status | Notes |
|---|---|---|---|
| Payment review list | Filters/searches live review rows and maps row actionability. | Wired | Search now selects the filtered first row. |
| Selected detail | Shows review proof, buyer note, breakdown, verification checklist, reviewer note, and reject reason. | Wired | Uses English review labels. |
| Approve Payment | Calls store-scoped review endpoint. | Wired | Disabled unless backend governance and row actionability allow it. |
| Reject Payment | Calls store-scoped review endpoint. | Wired | Reason is required in UI. |
| Request Clarification | Disabled. | Kept disabled | No backend route/lifecycle confirmed. |

## Mutations Wired

| Action | Status | Test Result | Notes |
|---|---|---|---|
| Approve payment | WIRED_AND_TESTED | Smoke target | Uses `APPROVE` and optional reviewer note. |
| Reject payment | WIRED_AND_TESTED | Smoke target | Requires reason, sent as `note`. |

## Mutations Kept Disabled

| Action | Reason | Next Requirement |
|---|---|---|
| Request clarification | No confirmed seller endpoint or lifecycle. | Backend/API contract and notification workflow. |
| Refund/dispute/settlement | Platform governance and audit lifecycle not in Seller 2026 mutation scope. | Dedicated payment governance task. |
| Payment profile approval/payout | Separate admin/governance flow. | Dedicated payment profile integration. |
| Order page payment status edit | Order pages must stay read-only for payment state. | No change planned. |

## Permission / Ownership

| Scenario | Expected | Result | Notes |
|---|---|---|---|
| Store owner reviews own store payment | Allowed | Smoke target | Owner has view permissions and backend `canReview`. |
| Store admin reviews own store payment | Allowed by backend | UI ready | Depends on live role context. |
| Order manager views payment review | Read allowed, mutation blocked | Existing role boundary retained | Backend `canReview` false keeps buttons disabled. |
| Cross-store owner accesses another store | Forbidden | Existing smoke coverage | Route store scope remains enforced. |

## Fixture / Smoke Mutation

| Mutation | Result | Rollback/Idempotency | Notes |
|---|---|---|---|
| Approve smoke payment | PASS target | Fixture resets `SELLER2026-PAYAPPROVE` payment/proof to pending before run. | Verifies success UI and order detail remains payment read-only. |
| Reject smoke payment | PASS target | Fixture resets `SELLER2026-PAYREJECT` payment/proof to pending before run. | Verifies success UI and order detail remains payment read-only. |

## Bugs Found
- Seller 2026 payment search filtered table rows but kept the unfiltered first selected payment detail.
- Seller 2026 payment review UI used disabled placeholder actions labelled `Mark Safe` and `Reject / Refund`, which did not match the backend seller review contract.

## Fixes Applied
- Added `payments.mutations.ts` with explicit approve/reject wrappers and whitelisted payloads.
- Added payment review governance/actionability fields to the adapter.
- Added payment review mutation state, validation, query invalidation, and refetch behavior to the hook.
- Replaced placeholder payment actions with `Approve Payment`, `Reject Payment`, and disabled `Request Clarification`.
- Added disposable approve/reject fixture rows to the live smoke runner.

## Testing
- Live smoke: PASS, `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`.
- Typecheck: PASS, `pnpm.cmd -F client exec tsc -b`.
- Build: PASS, `pnpm.cmd -F client build`.
- Seller 2026 lint: PASS with existing ignored-config warnings for Seller 2026 `.jsx` files.
- Full lint: not run; repo-wide lint debt remains out of scope.

## Risks Remaining
- Request clarification needs a real backend lifecycle.
- Payment review mutation remains dependent on backend `canReview` governance for role-level enforcement.
- Payment proof image and audit timeline richness are limited to the current seller payment review DTO.
- Refund/dispute/settlement and payment profile governance remain intentionally out of scope.

## Recommended Next Task
- Add a dedicated request-clarification backend contract if product policy requires it, or move to the next reviewed Seller 2026 mutation domain with a similarly scoped fixture.
