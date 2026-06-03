# Seller Workspace 2026 Add Product CTA Fix Report

## Task
SELLER-2026-FIX-ADD-PRODUCT-CTA-06

## Files Read
- `system_map.md`
- `client/src/App.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductsPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductEditorPage.jsx`
- `reports/seller-workspace-2026-api-delta-hardening-20260603-report.md`
- `reports/seller-workspace-2026-auth-fixture-live-smoke-20260603-report.md`
- `reports/seller-workspace-2026-notification-mutation-20260603-report.md`

## Files Modified
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-add-product-cta-fix-20260603-report.md`

## Root Cause
- The live Product Catalog Add Product CTA used `canUseAction(..., "products")`.
- The `products` mutation flag is intentionally `false` because risky product lifecycle actions such as publish, delete, media upload, variants, and bulk operations remain disabled.
- That disabled safe navigation to the product create route even when the seller had `CATALOG_PRODUCT_CREATE`.

## Fix Applied
- Add Product navigation now requires only `CATALOG_PRODUCT_CREATE`.
- Product draft save remains guarded separately by `productDraftSave` inside the create/edit page.
- The CTA route remains canonical: `/seller/stores/:storeSlug/catalog/products/new`.
- Added Playwright smoke coverage that clicks the CTA and asserts the target URL and product authoring shell.

## Route Behavior
| From | Action | Expected Target | Result |
|---|---|---|---|
| `/seller/stores/:storeSlug/catalog/products` | Click `+ Add Product` | `/seller/stores/:storeSlug/catalog/products/new` | Fixed and smoke-tested |

## Permission Check
| Permission | Backend Alias | Result |
|---|---|---|
| `CATALOG_PRODUCT_CREATE` | `PRODUCT_CREATE` | Required for Add Product navigation |
| `CATALOG_PRODUCT_UPDATE` | `PRODUCT_UPDATE`, `PRODUCT_EDIT` | Unchanged for edit actions |

## Testing
- Live smoke: `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts` PASS.
- Add Product CTA smoke: PASS. Final URL `/seller/stores/tp-preneurs-demo-store/catalog/products/new`.
- Typecheck: `pnpm.cmd -F client exec tsc -b` PASS.
- Build: `pnpm.cmd -F client build` PASS with existing Vite large chunk warning.
- Seller 2026 lint: `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx` PASS with one existing config warning because `src/routes/seller2026RouteConfig.jsx` is ignored.

## Risks Remaining
- Product publish/delete/media/variant mutations remain disabled by design.
- Seller 2026 `.jsx` route config may still be ignored by the current ESLint config.

## Next Steps
- Keep product lifecycle actions behind separate mutation enablement reviews.
