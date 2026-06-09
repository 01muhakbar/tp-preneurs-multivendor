# Seller Workspace 2026 Payment Profile Adoption Report

## 1. Task Title
`SELLER-WORKSPACE-2026-PAYMENT-PROFILE-DOCS-CLOSEOUT-14B`

## 2. Scope
- Adopt Payment Profile Seller Workspace 2026 ke canonical production route (`/seller/stores/:storeSlug/payment-profile`).
- Live API connected.
- Feature-flagged and rollbackable.
- Store-scoped and permission-aware.
- Smoke-tested.
- Direct verification status mutation disabled (admin boundaries unchanged).
- Sensitive data masking implemented.

## 3. Worktree Status Note
Clean. Only related route, flag, and smoke script files were changed.

## 4. Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerPaymentProfilePage.jsx`
- `client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx`
- `client/src/api/sellerPayments.ts`
- `client/src/api/seller2026/orders-payments.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026PaymentProfile.ts`
- `client/src/api/seller2026/payment-profile.mutations.ts`
- `server/src/routes/seller.payments.ts`
- `scripts/seller2026-payment-profile-adoption-smoke.ts`
- `reports/seller-workspace-2026-payment-review-adoption-20260608-report.md`
- `reports/seller-workspace-2026-orders-adoption-20260608-report.md`

## 5. Files Changed
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/App.jsx`
- `scripts/seller2026-payment-profile-adoption-smoke.ts`

## 6. Route Adoption Behavior
- **Target Route:** `/seller/stores/:storeSlug/payment-profile`
- **Component:** `Seller2026LivePaymentProfilePage`
- **Fallback Component:** `SellerPaymentProfilePage` (when flag is off)

## 7. Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_PAYMENT_PROFILE_ENABLED`

## 8. Endpoint Audit
- `GET /api/seller/stores/:storeId/payment-profile` (Fetch profile)
- `POST /api/seller/stores/:storeId/payment-profile/request/submit` (Submit request)

## 9. APIs Used
- `getSellerPaymentProfile` (`client/src/api/sellerPaymentProfile.ts`)
- `submitSellerPaymentProfileRequest` (`client/src/api/sellerPaymentProfile.ts`)

## 10. Payment Profile Data Contract
The payload normalizes the active snapshot, pending request, and reads `governance` boundaries correctly. Responses map seamlessly via `adaptSeller2026PaymentProfile`.

## 11. Sensitive Data Masking
- Raw bank/e-wallet account numbers are masked where appropriate in the response layer.
- Raw account number must not be logged in this report.
- Smoke uses dummy data only.

## 12. Seller-side Action Governance
- Seller can request/view payment profile.
- Seller cannot approve/verify own payment profile.
- Admin remains final authority for payment profile approval.
- Settlement/disbursement flow remains unchanged.

## 13. Request/View Behavior
- Read payment profile and masked snapshot view are fully functional.

## 14. Whitelisted Payload
- `accountName`
- `merchantName`
- `merchantId`
- `qrisImageUrl`
- `qrisPayload`
- `instructionText`
- `sellerNote`

## 15. Blocked Payload Fields
- Direct verify/approve.
- Payout amount or settlement instructions.
- Destructive mutation flags.

## 16. Permission Behavior
Role-aware through `STORE_PAYMENT_PROFILE_READ` and `STORE_PAYMENT_PROFILE_SUBMIT`.

## 17. Cross-store Behavior
Safely guarded via context resolution; accessing other stores triggers forbidden state without leaking data.

## 18. Admin Approval Boundary
Admin review process and approval mechanisms are completely untouched and fully enforced.

## 19. Settlement/Payout Boundary
Unchanged. Disbursement is independent of seller profile setup UI.

## 20. Fixture/Smoke Data Strategy
Dummy store (`tp-preneurs-demo-store`), mock suborders, and safe values only.

## 21. Route Link Safety
All internal links correctly route to canonical `/seller/stores/:storeSlug/*`.

## 22. Preview Behavior
Isolated preview route `/seller-2026/payment-profile` is still mock-driven.

## 23. Disabled Actions
- Direct verify/approve
- Admin review override
- Settlement/payout mutation
- Delete/destructive profile mutation
- Raw sensitive data export

## 24. UI States
- `Seller2026LivePaymentProfilePage` embedded layout renders cleanly.
- Errors degrade gracefully with standard `s26-empty` presentation block.

## 25. Smoke Results
- Typecheck PASS
- Client build PASS
- Server build PASS
- Flags off PASS
- Flags on PASS
- Owner read/request PASS
- Sensitive masking PASS
- Role-limited member PASS
- Cross-store guard PASS
- Admin approval boundary PASS
- Settlement/payout boundary PASS
- Regression PASS

## 26. Typecheck/Build/Lint Results
Previously PASS; no runtime code changed after docs closeout.

## 27. Bugs Fixed
N/A

## 28. Known Limitations
- The preview route relies on static dummy values, meaning live tests must run on store-scoped instances.

## 29. Rollback Notes
- Global flag off -> legacy Payment Profile
- Payment center/profile flag off -> legacy Payment Profile
- Flags on -> Seller 2026 live Payment Profile

## 30. Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-ADOPT-STORE-PROFILE-15`
