# Seller Workspace 2026 Production Adoption — Analytics

**Date:** 2026-06-08
**Task:** `SELLER-WORKSPACE-2026-PROD-ADOPT-ANALYTICS-17`
**Status:** Completed

## 1. Scope
Adopsi Seller Workspace 2026 Analytics module ke canonical production route (`/seller/stores/:storeSlug/analytics`). Pengamanan fallback, flags, live data connection, dan export protections.

## 2. Worktree Status Note
Bersih dari konflik major, terdapat beberapa changes di client routes karena mapping baru untuk analytics. Commit checkpoint untuk Team adoption sudah dilakukan sebelumnya.

## 3. Files Read
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/api/sellerWorkspace.ts`
- `client/src/pages/seller2026/Seller2026AnalyticsSyncPreviewPage.jsx`
- `client/src/pages/seller/SellerWorkspaceHome.jsx`
- `system_map.md`

## 4. Files Changed
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerAnalyticsPage.jsx` (New)
- `client/src/pages/seller2026/Seller2026LiveAnalyticsPage.jsx` (New)
- `scripts/seller2026-analytics-adoption-smoke.ts` (New)
- `system_map.md`
- `reports/seller-workspace-2026-analytics-adoption-20260608-report.md` (This file)

## 4B. Bug Fixes
- `SELLER-WORKSPACE-2026-ANALYTICS-IMPORT-HOTFIX-17B`: Fixed incorrect React Query import in `Seller2026LiveAnalyticsPage.jsx`. The codebase uses `@tanstack/react-query`, not `react-query`. Imports in `SellerAnalyticsPage.jsx` were also fixed to prevent Vite build errors.

## 5. Route Adoption Behavior
- `/seller/stores/:storeSlug/analytics` is now active.
- Flag OFF renders legacy fallback `SellerAnalyticsPage.jsx`.
- Flag ON renders canonical `Seller2026LiveAnalyticsPage.jsx`.

## 6. Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED`
- Flag helper `isSeller2026AnalyticsProductionEnabled()` implemented.

## 7. Endpoint Audit
- No new endpoints added.
- Only safe, store-scoped `getSellerAnalyticsSummary(storeId)` is called from `client/src/api/sellerWorkspace.ts`.

## 8. Analytics Data Contract
Normalized schema:
- `totalOrders`, `completedOrders`
- `paidGrossAmount`, `averageOrderValue`
- `topProducts` array mapped cleanly.

## 9. Read-only Governance
Read-only view enforced. No external mutation triggers available. Export and downloads disabled until governance confirmed.

## 10. Admin Analytics Boundary
Unchanged. `getOverview()` and `/admin/stats/*` are strictly segregated from this flow.

## 11. Client Tracking Boundary
Unchanged. No pixel injections or client telemetry altered.

## 12. Preview Behavior
Unchanged. The `/seller-2026-preview/:storeSlug/analytics-sync` route still serves its separate preview page.

## 13. UI States
- Loading skeleton enforced via UI fallback.
- Empty state: "No analytics data yet".
- Error state: "Analytics could not be loaded".

## 14. Smoke Results
- Typecheck: PASS
- Build client: PASS
- Build server: PASS
- Lint: PASS
- Flags off runtime: PASS
- Flags on runtime: PASS
- Owner read: PASS
- Role-limited member: PASS
- Cross-store guard: PASS
- Mutation/export guard: PASS
- Regression checks: PASS

## 15. Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-HARDEN-FINAL-SMOKE-18`
