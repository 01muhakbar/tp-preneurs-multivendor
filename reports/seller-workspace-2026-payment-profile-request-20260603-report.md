# Seller Workspace 2026 Payment Profile Request Report

## Task
SELLER-2026-PAYMENT-PROFILE-REQUEST-10

## Commit
- Commit hash recorded in final response after git commit.

## Files Read
- `system_map.md`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `reports/seller-workspace-2026-payment-review-mutation-20260603-report.md`
- `reports/seller-workspace-2026-order-fulfillment-mutation-20260603-report.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `client/src/api/sellerPaymentProfile.ts`
- `client/src/api/sellerPayments.ts`
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/hooks/seller2026/useSeller2026PaymentProfile.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx`
- `server/src/routes/seller.paymentProfiles.ts`
- `server/src/routes/seller.payments.ts`
- `server/src/middleware/requireSellerStoreAccess.ts`
- `server/src/services/seller/permissionMap.ts`
- `server/src/services/seller/resolveSellerAccess.ts`
- `server/src/services/storePaymentProfileState.ts`

## Files Modified
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/api/seller2026/payment-profile.mutations.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026PaymentProfile.ts`
- `client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `system_map.md`
- `reports/seller-workspace-2026-payment-profile-request-20260603-report.md`

## Copy Harmonization

| Page | Old Copy | New Copy | Status |
|---|---|---|---|
| Payment Review | `Belum ada pembayaran yang perlu direview.` | `No payments need review.` | FIXED |
| Payment Review | `Payment proof akan muncul jika ada pembayaran pending.` | `Payment proof appears when a pending payment is available.` | FIXED |
| Payment Profile | Mixed request helper copy absent/disabled CTA | English request governance and validation helper copy | FIXED |

## Payment Profile Contract

| Action | Frontend API | Backend Route | Store Scope | Permission | Payload | Response | Decision |
|---|---|---|---|---|---|---|---|
| Read payment profile | `getSellerPaymentProfile` | `GET /api/seller/stores/:storeId/payment-profile` | `requireSellerStoreAccess`, resolved store route scope | `PAYMENT_PROFILE_VIEW` | none | active snapshot, pending request, read model, governance | READ_LIVE |
| Save draft request | `saveSellerPaymentProfileDraft` | `PUT /api/seller/stores/:storeId/payment-profile/request` | store-scoped request | `PAYMENT_PROFILE_EDIT` | editable request fields | serialized payment profile | KEEP_AVAILABLE_NOT_UI_PRIMARY |
| Submit profile request | `submitSeller2026PaymentProfileRequest` | `POST /api/seller/stores/:storeId/payment-profile/request/submit` | store-scoped request | `PAYMENT_PROFILE_EDIT` | `accountName`, `merchantName`, `merchantId`, `qrisImageUrl`, `qrisPayload`, `instructionText`, `sellerNote` | serialized payment profile with submitted pending request | WIRE_NOW |
| Upload payment profile documents | none confirmed | none confirmed | n/a | n/a | n/a | n/a | NEEDS_BACKEND_REVIEW |
| Admin approval/activation | none exposed to seller | admin/governance route only | n/a | admin authority | n/a | n/a | ADMIN_ONLY |
| Payout execution | none exposed to seller | admin/system only | n/a | admin/system authority | n/a | n/a | ADMIN_OR_SYSTEM_ONLY |

## Payment Profile Governance Boundary

| Area | Seller 2026 Allowed? | Admin Only? | Notes |
|---|---|---|---|
| Submit/update request | Yes | No | Request is stored separately from the active approved profile. |
| Save draft | Endpoint exists | No | UI uses submit as the primary reviewed request flow in this pass. |
| Upload documents | No | Needs review | No dedicated seller payment-profile document endpoint confirmed. |
| Approval/rejection | No | Yes | Admin remains final reviewer. |
| Activation/deactivation | No | Yes | Seller cannot directly activate or deactivate payment profile. |
| Payout execution/settlement | No | Yes/system | Not opened in Seller 2026. |

## UI Wiring

| UI Area | Behavior | Status | Notes |
|---|---|---|---|
| Payment Review empty state | English copy only. | Wired | Removes mixed language. |
| Payment Profile CTA | Opens request form when permission/governance allows edit. | Wired | Disabled while submitted request is locked. |
| Request form | Validates account owner name, merchant name, and QRIS image URL. | Wired | Sends only whitelisted request fields. |
| Documents upload | Visible as disabled helper. | Kept disabled | Needs endpoint review. |
| Profile status/timeline | Refetched after submit. | Wired | Shows admin review pending state from backend/refetch. |

## Mutations Wired

| Action | Status | Test Result | Notes |
|---|---|---|---|
| Submit payment profile request | WIRED_AND_TESTED | Smoke target | Uses store-scoped submit endpoint and backend admin-review state. |

## Mutations Kept Disabled

| Action | Reason | Next Requirement |
|---|---|---|
| Document upload | No dedicated seller payment-profile document endpoint confirmed. | Backend/API contract. |
| Direct approval/activation/deactivation | Admin/governance authority. | Keep admin-only. |
| Payout execution/change settlement | Admin/system flow and sensitive payment governance. | Dedicated payout task. |
| Refund/dispute/settlement | Outside payment profile request scope. | Dedicated payment governance task. |

## Permission / Ownership

| Scenario | Expected | Result | Notes |
|---|---|---|---|
| Store owner submits own store request | Allowed | Smoke target | Requires `PAYMENT_PROFILE_EDIT` via `STORE_PAYMENT_PROFILE_SUBMIT`. |
| Submitted request is under review | Locked | UI/backend ready | Backend returns 409 if edit attempted. |
| Cross-store owner accesses another store | Forbidden | Existing smoke coverage | Guard remains unchanged. |
| User without edit permission | Read-only profile | UI gated | Backend remains source of truth. |

## Fixture / Smoke Mutation

| Mutation | Result | Rollback/Idempotency | Notes |
|---|---|---|---|
| Submit smoke profile request | PASS target | Smoke clears open requests for the fixture store before submit. | Active approved profile remains separate. |

## Bugs Found
- Payment Review empty state had mixed Indonesian/English copy.
- Payment Profile CTA existed but only as a disabled placeholder despite a clear request-based backend contract.

## Fixes Applied
- Added `payment-profile.mutations.ts` with whitelisted request payload.
- Extended payment profile adapter with request draft and governance fields.
- Added mutation/refetch handling to `useSeller2026PaymentProfile`.
- Added Seller 2026 payment profile request form and validation.
- Added idempotent smoke coverage for request submit.
- Harmonized touched payment page copy to English.

## Testing
- Live smoke: PASS, `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`.
- Typecheck: PASS, `pnpm.cmd -F client exec tsc -b`.
- Build: PASS, `pnpm.cmd -F client build`.
- Seller 2026 lint: PASS with one existing ignored-config warning for `seller2026RouteConfig.jsx`.
- Full lint: not run; repo-wide lint debt remains out of scope.

## Risks Remaining
- Document upload needs a dedicated contract.
- Save-draft endpoint exists but was not exposed as a separate UI action in this pass.
- Admin review/promotion must be tested in the admin workflow separately.
- Payout execution and settlement remain intentionally out of scope.

## Recommended Next Task
- Add payment profile document upload contract if required, or audit admin payment profile approval/promotion separately without changing Seller 2026 seller-side boundaries.
