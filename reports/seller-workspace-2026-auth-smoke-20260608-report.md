# Seller Workspace 2026 Auth Smoke Report

## 1. Task Title

`SELLER-WORKSPACE-2026-AUTH-SMOKE-02`

## 2. Scope

Authenticated smoke/testing/hardening ringan untuk Seller Workspace 2026 setelah slicing adoption. Fokus: owner session, role-limited member, cross-store guard, preview routes, canonical flags off/on, legacy redirects, Admin regression, dan Client Storefront regression.

## 3. Files Read

- `system_map.md`
- `reports/seller-workspace-2026-slicing-adoption-20260608-report.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/features/seller2026/**/*`
- `client/src/features/sellerWorkspace2026/**/*`
- `client/src/api/seller*.ts`
- `server/src/routes/seller*.ts`
- `server/src/routes/auth.ts`
- `server/src/services/authSession.service.ts`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- Existing `scripts/*smoke*` and fixture-related scripts via `rg`

## 4. Files Changed

- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `scripts/seller2026-auth-slicing-adoption-smoke.ts`
- `client/src/pages/seller/SellerOrdersPage.jsx`
- `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OverviewAdapter.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OrdersAdapter.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026TeamAdapter.js`
- `system_map.md`
- `reports/seller-workspace-2026-auth-smoke-20260608-report.md`
- `reports/seller-workspace-2026-auth-smoke-20260608-results.json`

## 5. Smoke Runner Used/Created

Created `scripts/seller2026-auth-slicing-adoption-smoke.ts`.

The existing `scripts/seller2026-auth-fixture-live-smoke.ts` was extended to export `ensureSeller2026AuthSmokeFixture()` and guarded with `pathToFileURL()` so it can be reused without running its mutation-heavy smoke path.

The new runner uses Playwright, deterministic fixtures, and server-compatible auth session cookies built from `buildAuthSessionClaims()` to avoid repeated `/api/auth/login` rate-limit lockouts during local smoke loops.

## 6. Fixture Accounts

- Owner: `seller.owner@example.test` / `Password123!` / `tp-preneurs-demo-store`
- Role-limited member: `seller.member@example.test` / `Password123!` / `tp-preneurs-demo-store`
- Other store owner fixture: `seller.other@example.test` / `Password123!` / `other-demo-store`
- Buyer fixture: `seller.buyer@example.test` / `Password123!`

Fixture includes active store membership, product/category/attribute data, coupon data, suborders, payment proof/profile data, team audit, unread notifications, and other-store guard data.

## 7. Feature Flags Tested

Flags off/default:
- `CLIENT_URL=http://localhost:5173`

Flags on/safe adopted routes only:
- `CLIENT_URL_FLAGS_ON=http://localhost:5174`
- `VITE_SELLER_WORKSPACE_2026_ENABLED=true`
- `VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED=true`
- `VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED=true`
- `VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED=true`

No default feature flag state was changed.

## 8. Route Matrix

Final smoke result artifact: `reports/seller-workspace-2026-auth-smoke-20260608-results.json`

Summary:
- Total route cases: 52
- Failures: 0
- Expected forbidden: 4
- Skipped: 0

Groups:
- Preview isolated: 7 PASS
- Preview store-scoped: 4 PASS
- Canonical flags-off: 17 PASS
- Legacy redirects: 4 PASS
- Cross-store owner: 4 FORBIDDEN expected
- Canonical flags-on: 4 PASS
- Role-limited member: 6 PASS
- Admin regression: 3 PASS
- Client regression: 3 PASS

## 9. Owner Smoke Result

PASS. Owner session rendered Seller shell, store context, dashboard/catalog/orders/payment/team/notifications routes, and legacy redirects without crash.

## 10. Role-Limited Member Smoke Result

PASS. Role-limited member session rendered dashboard, orders, order detail, team, payment profile, and payment review without session failure or crash. Restricted actions remain permission-aware in the UI.

## 11. Cross-Store Guard Result

PASS. Owner of `tp-preneurs-demo-store` received permission-safe forbidden pages for:
- `/seller/stores/other-demo-store`
- `/seller/stores/other-demo-store/catalog/products`
- `/seller/stores/other-demo-store/orders`
- `/seller/stores/other-demo-store/team`

No other-store data was exposed.

## 12. Preview Smoke Result

PASS.

Preview isolated routes tested:
- `/seller-2026`
- `/seller-2026/dashboard`
- `/seller-2026/catalog/products`
- `/seller-2026/orders`
- `/seller-2026/payment-profile`
- `/seller-2026/team`
- `/seller-2026/notifications`

Preview store-scoped routes tested:
- `/seller-2026-preview/tp-preneurs-demo-store`
- `/seller-2026-preview/tp-preneurs-demo-store/catalog/products`
- `/seller-2026-preview/tp-preneurs-demo-store/orders`
- `/seller-2026-preview/tp-preneurs-demo-store/team`

## 13. Canonical Flags-Off Result

PASS. Canonical seller routes remained rollback-safe with default flags off, including dashboard, store profile, catalog, products, categories, attributes, coupons, orders, payment review, payment profile, team, team audit, and notifications.

## 14. Canonical Flags-On Result

PASS. Only safe/adopted routes were enabled and tested:
- `/seller/stores/tp-preneurs-demo-store`
- `/seller/stores/tp-preneurs-demo-store/dashboard`
- `/seller/stores/tp-preneurs-demo-store/catalog/products`
- `/seller/stores/tp-preneurs-demo-store/notifications`

## 15. Admin Regression Result

PASS. Admin routes redirected to `/admin/login` for unauthenticated smoke and did not render Seller shell:
- `/admin/dashboard`
- `/admin/store/applications`
- `/admin/store/customization?storeTab=home-settings`

## 16. Client Regression Result

PASS. Client routes rendered without Seller shell leakage:
- `/`
- `/store/demo-store`
- `/checkout`

## 17. Console/Page Error Summary

No fatal console errors or uncaught page errors in the final PASS smoke.

Expected 403 network console messages appeared only on cross-store guard routes and were classified as safe because the permission page rendered and no data leaked.

## 18. Build/Typecheck/Lint Result

- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client build`: PASS
- `pnpm.cmd -F client exec eslint ...touched client files...`: PASS with warnings that two `.jsx` paths were ignored by the active ESLint config.
- Auth smoke: PASS (`pnpm.cmd exec tsx scripts/seller2026-auth-slicing-adoption-smoke.ts`)

## 19. Bugs Fixed

- Fixed missing `sellerPrimaryButtonClass` import in `SellerOrdersPage.jsx`, which caused the canonical Orders page to blank/crash under smoke.
- Fixed preview store-scoped dashboard/orders/team slug handling so preview routes resolve `storeSlug -> storeId` before calling APIs that expect numeric store ids.
- Prevented non-dashboard/non-storefront preview wrapper paths from firing unrelated overview/store-profile hooks.
- Hardened auth smoke script so repeated local runs do not hit auth login rate limits.

## 20. Blockers

None for this task.

## 21. Known Limitations

- Smoke is local/dev-fixture based, not a production/staging browser run.
- The smoke runner issues auth cookies locally using the same server session claims and JWT secret path to avoid login rate limits; it still exercises the real auth middleware/session contract.
- Repo-wide lint remains outside scope due known existing lint debt.
- Admin regression was unauthenticated guard smoke, not an authenticated admin workflow smoke.

## 22. Rollback Notes

- Legacy Seller pages and redirects were not removed.
- Default feature flags remain off.
- Backend/schema/auth middleware were not changed.
- Public storefront visibility was not changed.
- The new smoke runner can be removed without affecting runtime routes.

## 23. Next Recommended Task

`SELLER-WORKSPACE-2026-PROD-HARDEN-NOTIFICATIONS-03`

Focus: notification route hardening, permission/action affordance audit, and a slightly deeper notifications workflow smoke without broad route adoption.
