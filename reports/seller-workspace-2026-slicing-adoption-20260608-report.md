# Seller Workspace 2026 Slicing Adoption Report

## 1. Task Title
SELLER-WORKSPACE-2026-SLICING-ADOPTION-01

## 2. Scope
- Adopt and harden the Seller Workspace 2026 slicing foundation without backend, schema, auth middleware, Admin Workspace, or Client Storefront changes.
- Preserve legacy Seller pages and redirects as rollback.
- Add plain isolated `/seller-2026` preview routes while keeping existing `/seller-2026-preview/:storeSlug` live-adapter preview routes.
- Add requested `features/seller2026` adapters, hooks, components, and live export foundation.

## 3. Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/pages/seller/*`
- `client/src/pages/seller2026/*`
- `client/src/features/seller2026/*`
- `client/src/features/sellerWorkspace2026/*`
- `client/src/api/seller*.ts`
- `client/src/api/seller2026/*`
- `server/src/routes/seller*.ts`
- `docs/seller-2026/README.md`
- `docs/seller-2026/IMPLEMENTATION_MAP.md`
- `docs/seller-2026/seller-2026-mockups/*`

## 4. Files Changed
- `client/src/App.jsx`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `system_map.md`
- `reports/seller-workspace-2026-slicing-adoption-20260608-report.md`

## 5. Files Copied From Slicing
- Existing copied package was already present in `client/src/features/seller2026`.
- Existing Seller 2026 pages were already present in `client/src/pages/seller2026`.
- Existing mockup assets were already present under `docs/seller-2026/seller-2026-mockups`.
- This pass added missing foundation directories under `client/src/features/seller2026`: `adapters`, `hooks`, `components`, and `live`.

## 6. Route Changes
- Added exact isolated preview route family `/seller-2026` with required child routes.
- Kept existing `/seller-2026-preview/:storeSlug` route family.
- Kept preview routes mounted before `/seller/stores/:storeSlug`.
- Rewired canonical Seller routes so legacy pages render when global or route flags are off.
- Kept `team/audit` before `team/:memberId`.
- Preserved all legacy redirects.

## 7. Feature Flags Added
- Added helper support for:
  - `VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED`
  - `VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED`
  - `VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED`
  - `VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED`
- Existing helpers remain for global, store profile, catalog, product detail, authoring, coupons, orders, payment center, team, and analytics sync.
- Default state is off unless an env var is exactly `true`.

## 8. API Modules Used
- `sellerWorkspace.ts`
- `sellerStoreProfile.ts`
- `sellerProducts.ts`
- `sellerCategories.ts`
- `sellerAttributes.ts`
- `sellerCoupons.ts`
- `sellerOrders.ts`
- `sellerPayments.ts`
- `sellerPaymentProfile.ts`
- `sellerTeam.ts`
- `sellerInvitations.ts`
- `sellerTeamAudit.ts`
- `sellerNotifications.ts`
- `api/seller2026/*` adapters

## 9. Duplicate Features Found
- Legacy Seller pages remain in `client/src/pages/seller`.
- Seller 2026 live pages remain in `client/src/pages/seller2026`.
- Existing richer preview exists under `/seller-2026-preview/:storeSlug`.
- Plain slicing preview now exists under `/seller-2026`.

## 10. Merge / Adoption Decision
- Keep legacy as default rollback.
- Keep Seller 2026 live pages behind route-level flags.
- Keep plain `/seller-2026` preview mock-only.
- Keep store-scoped preview for adapter review.

## 11. Admin Boundary Notes
- No Admin Workspace route or approval authority changed.
- Product approval, payment audit, store applications, payment profile verification, and platform governance remain admin-owned.

## 12. Seller Boundary Notes
- Live hooks resolve `storeId`, `storeSlug`, seller context, and workspace routes through `useSellerWorkspaceRoute()`.
- Live hooks use existing store-scoped seller APIs.
- No mock fallback is introduced for live canonical routes.

## 13. Storefront Boundary Notes
- No public storefront visibility rule changed.
- Seller 2026 preview remains isolated and cannot publish storefront data.
- Product review submit remains separate from public publish.

## 14. Mutation Governance
- This pass did not add new destructive mutations.
- Existing mutation gates and backend enforcement remain authoritative.
- Product publish/delete/duplicate, bulk order mutation, payout mutation, and team destructive actions remain review-required.

## 15. Smoke Results
- Static route/config review completed.
- English-copy scan over Seller 2026 copied feature/pages/routes found only existing close-button symbols, not Indonesian UI copy.
- Dev server smoke used Vite on `http://localhost:5174` because port 5173 was already occupied.
- HTTP route smoke returned `200` and root HTML for `/seller-2026`, `/seller-2026/catalog/products`, `/admin/dashboard`, `/`, and `/store/demo-store`.
- In-app Browser plugin smoke could not run because the `iab` browser backend was unavailable in this session.
- Authenticated seller route smoke was not run because no seller session fixture was active in the browser.

## 16. Build / Typecheck / Lint Results
- `pnpm -F client exec tsc -b` was blocked by PowerShell execution policy for `pnpm.ps1`; rerun with `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS. Vite emitted the existing chunk-size warning for large bundles.
- `pnpm.cmd -F client lint`: FAIL due to pre-existing repo-wide lint debt, primarily `@typescript-eslint/no-explicit-any` and unused variables in unrelated API/util files.
- Targeted lint through direct ESLint path invocation exited with warnings that this config ignored the direct JSX path set; no targeted lint errors were reported.

## 17. Known Limitations
- `/seller-2026/team/invitations` currently points to the audit/invitations surface in the raw slicing workspace.
- Seller notifications have no legacy seller page, so the canonical notifications route remains Seller 2026 live while its flag is documented as reserved.
- Authenticated browser smoke requires a valid seller session fixture.

## 18. Rollback Instructions
- Set `VITE_SELLER_WORKSPACE_2026_ENABLED=false` or remove it.
- Keep all route-level flags unset or false.
- Legacy canonical Seller pages render for all routes where legacy pages exist.
- `/seller-2026` and `/seller-2026-preview/:storeSlug` can be removed from `seller2026RouteConfig.jsx` if preview must be hidden.

## 19. Next Recommended Tasks
- Run authenticated browser smoke for `/seller-2026`, canonical seller routes, admin dashboard, and storefront routes.
- Decide whether to add a legacy-compatible Seller notifications fallback or formally adopt notifications as the first always-on Seller 2026 read route.
- Continue route-by-route adoption starting with dashboard or product catalog by enabling global plus route-level flags in a controlled environment.
