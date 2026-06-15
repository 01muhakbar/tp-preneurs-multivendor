# Seller Suborder Detail Page 2026 Adoption Report

Date: 2026-06-13

## Scope

- Adopted the Seller Workspace 2026 suborder detail UI for:
  `/seller/stores/:storeSlug/orders/:suborderId`.
- Main integration target:
  `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`.
- The requested slicing bundle was not present in the repository or attachment, so the three target files were recreated from the requested contract and existing backend read model.

## Files Added

- `client/src/pages/seller2026/SellerSuborderDetail2026PageView.jsx`
- `client/src/pages/seller2026/seller-suborder-detail-2026.css`
- `client/src/pages/seller2026/sellerSuborderDetail2026Adapter.js`

## Files Updated

- `client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx`

## Routing

- `client/src/App.jsx` already uses the safe conditional route:
  - Seller 2026 detail page when Seller 2026 Orders production flag is enabled.
  - Legacy `SellerOrderDetailPage` fallback when the flag is disabled.
- The legacy import and route fallback remain intact.

## Implementation

- Replaced the old embedded workspace detail rendering with the dedicated 2026 page view.
- Continued using `useSellerWorkspaceRoute()` for store context and internal routes.
- Continued using `useSeller2026SuborderDetail()` for store-scoped backend data and fulfillment mutations.
- Normalized order reference, scope, dates, customer, shipping, payment, costs, items, progress, and timeline through the new adapter.
- Added safe fallbacks for missing customer, address, tracking, proof, and payment method fields.
- Added responsive item table scrolling for small screens.
- Added a local search field that does not mutate backend data.
- Added copy-reference feedback and `window.print()` receipt fallback.
- Internal notes remain a visual placeholder; no note endpoint was added.

## Fulfillment Safety

- `Mark as Packed` maps to `MARK_PROCESSING`.
- `Mark as Shipped` maps to `MARK_SHIPPED`.
- `Mark as Delivered` maps to `MARK_DELIVERED`.
- Buttons are enabled only when the backend-provided fulfillment action is present and enabled, and the current seller role has fulfillment permission.
- Shipped payload reuses the existing tracking, courier code, and courier service contract.
- Mutation remains scoped to:
  `PATCH /api/seller/stores/:storeId/suborders/:suborderId/fulfillment`.
- Existing order/detail/dashboard/notification queries are refreshed after success.

## Guardrails

- `SellerLayout.jsx` was not modified.
- No seller sidebar or global header was duplicated.
- No API endpoint was added.
- Seller actions remain suborder-scoped.
- Backend `requireSellerStoreAccess()` remains the authorization source of truth.
- Payment status and proof remain read-only.
- No payment approval or rejection action is exposed in Seller Orders.
- Cross-store access remains blocked.

## QA Results

- `pnpm -F client exec tsc -b` passed.
- `pnpm -F client build` passed.
- `pnpm -F server build` passed.
- `git diff --check` passed for the related files.
- `pnpm exec tsx scripts/seller2026-orders-adoption-smoke.ts` passed.
  - Fatal console errors: 0
  - Page errors: 0
  - Blocked unsafe mutations: 0
  - Expected fulfillment mutation: 1
- `pnpm exec tsx scripts/seller2026-order-fulfillment-production-verify-smoke.ts` passed.
  - Orders route passed.
  - Detail production route passed.
  - Payment read-only boundary passed.
  - Admin/client boundaries passed.
  - Unauthorized access boundary passed.

## Smoke Routes

- `/seller/stores/:storeSlug/orders`
- `/seller/stores/:storeSlug/orders/:suborderId`
- `/seller/stores/:storeSlug/payment-review`
- `/seller/stores/:storeSlug`
- `/seller/stores/:storeSlug/store-profile`

## Notes

- The in-app visual browser surface was unavailable during final inspection. Production-route Playwright smoke scripts still rendered and inspected the page successfully at desktop viewport, including the detail marker, read-only payment boundary, and fulfillment controls.
- The client build retains existing Vite chunk-size warnings; no new build failure was introduced.
