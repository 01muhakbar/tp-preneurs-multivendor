# Seller Workspace 2026 Analytics Production Adoption Report

## Task ID
`SELLER-WORKSPACE-2026-PROD-ADOPT-ANALYTICS`

## Status
`ANALYTICS_PRODUCTION_ADOPTION_FLAGGED`
`ANALYTICS_READ_ONLY_HARDENED`

## Files Read
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/pages/seller/*`
- `client/src/pages/seller2026/*`
- `client/src/features/sellerWorkspace2026/*`
- `client/src/api/sellerWorkspace.ts`
- `client/src/api/sellerProducts.ts`
- `client/src/api/sellerCategories.ts`
- `client/src/api/sellerAttributes.ts`
- `client/src/api/sellerCoupons.ts`
- `client/src/api/sellerOrders.ts`
- `client/src/api/sellerPayments.ts`
- `client/src/api/sellerPaymentProfile.ts`
- `client/src/api/sellerStoreProfile.ts`
- `client/src/api/sellerTeam.ts`
- `client/src/api/sellerTeamAudit.ts`
- `client/src/api/sellerNotifications.ts`
- `client/src/pages/admin/*`
- `client/src/pages/store/*`
- `client/src/components/store/*`
- `client/src/components/seller/*`
- `client/src/utils/sellerWorkspaceRoute.js`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `scripts/seller2026-analytics-adoption-smoke.ts`
- `system_map.md`

## Files Changed
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026AnalyticsAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Analytics.js`
- `client/src/pages/seller2026/Seller2026LiveAnalyticsPage.jsx`
- `scripts/seller2026-analytics-adoption-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-analytics-adoption-20260609-report.md`

## Reality Gap
Expected from `system_map.md`:
- Seller 2026 production routes should be feature-flagged with legacy fallback.
- Analytics was still documented as not enabled / needs review in older sections.

Actual repository state:
- `Seller2026LiveAnalyticsPage.jsx` existed and already used `@tanstack/react-query`, but queried analytics directly with the route slug.
- Dedicated analytics adapter/hook files were missing.
- Analytics route was flag-gated with `SellerAnalyticsPage` fallback.
- Feature flags existed, but needed global-gated pure helpers and the requested analytics sync preview helper.

Delta implemented:
- Added read-only analytics adapter and React Query hook.
- Updated analytics page to resolve canonical store id via `SellerLayout` route context.
- Kept analytics under `/seller/stores/:storeSlug/analytics` behind global + analytics flags.
- Retained `SellerAnalyticsPage` fallback when flags are off.
- Hardened analytics page copy and disabled sync/publish/rebuild/export-style actions.
- Updated `system_map.md` with 3-app boundary, canonical routes, flags, duplicate resolution, and final analytics adoption status.

Delta deferred:
- No analytics mutation workflow.
- No storefront sync/public visibility mutation.
- No backend/API/schema/auth/permission changes.
- No Client / Storefront behavior changes.

## Route Validation
- `/seller/stores/:storeSlug/analytics`: feature-flagged in `App.jsx`.
- Fallback when flags off: `SellerAnalyticsPage`.
- Cross-store guard: remains owned by `SellerLayout` context and backend `requireSellerStoreAccess`.
- Member permission handling: page renders permission-safe state when dashboard/store view permission is missing.

## API Boundary
- APIs used: `getSellerAnalyticsSummary(storeId)` from `client/src/api/sellerWorkspace.ts`.
- APIs not changed: all seller/admin/client API contracts.
- Backend/schema/auth/permission changes: none.

## Admin Workspace Boundary
- Admin approval unchanged.
- Admin payment audit unchanged.
- Admin public gate unchanged.
- Seller Analytics does not publish, approve, or change public visibility.

## Client / Storefront Boundary
- Public storefront visibility unchanged.
- Draft/unpublished product visibility unchanged.
- Public-safe read only.

## Mutation Boundary
- Analytics is read-only.
- Sync/publish/rebuild/export/public visibility mutations disabled or absent.

## Validation Results
- `pnpm -F client exec tsc -b`: PASS via `pnpm.cmd -F client exec tsc -b`
- `pnpm -F client build`: PASS via `pnpm.cmd -F client build`
- `pnpm -F server build`: PASS via `pnpm.cmd -F server build`
- `pnpm exec tsx scripts/seller2026-auth-fixture-live-smoke.ts`: FAIL, API not reachable at `http://localhost:3001/api/health`
- `pnpm exec tsx scripts/seller2026-analytics-adoption-smoke.ts`: PASS via `pnpm.cmd exec tsx scripts/seller2026-analytics-adoption-smoke.ts`
- `git diff --check`: PASS

## Known Issues
- Live auth/browser smoke requires the API server to be running on `http://localhost:3001`.
- Client build still reports existing Vite chunk-size warnings.

## Rollback
Disable:
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED`

## Next
1. `SELLER-WORKSPACE-2026-PROD-FINAL-SMOKE-28`
2. `SELLER-WORKSPACE-2026-RELEASE-NOTES-29`
