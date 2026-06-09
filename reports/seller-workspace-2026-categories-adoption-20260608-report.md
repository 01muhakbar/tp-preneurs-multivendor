# SELLER-WORKSPACE-2026-PROD-ADOPT-CATEGORIES-08 Report

## 1. Task Title

`SELLER-WORKSPACE-2026-PROD-ADOPT-CATEGORIES-08`

## 2. Scope

Adopt Seller Workspace 2026 Categories on the canonical production route behind flags, using live store-scoped APIs and preserving legacy rollback.

Route:
- `/seller/stores/:storeSlug/catalog/categories`

## 3. Files Read

- `system_map.md`
- `reports/seller-workspace-2026-product-detail-adoption-20260608-report.md`
- `reports/seller-workspace-2026-catalog-adoption-20260608-report.md`
- `reports/seller-workspace-2026-dashboard-adoption-20260608-report.md`
- `reports/seller-workspace-2026-notifications-hardening-20260608-report.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerCategoriesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/sellerCategories.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Categories.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `server/src/routes/seller.categories.ts`
- Seller 2026 smoke scripts for dashboard, catalog, product detail, authoring, and notifications.

Missing requested file:
- `reports/seller-workspace-2026-authoring-hardening-20260608-report.md` was not present in the workspace.

## 4. Files Changed

- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `scripts/seller2026-categories-adoption-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-categories-adoption-20260608-report.md`

## 5. Route Adoption Behavior

- Global flag off: `/seller/stores/:storeSlug/catalog/categories` renders `SellerCategoriesPage`.
- Global flag on and categories flag off: renders `SellerCategoriesPage`.
- Global flag on and categories flag on: renders `Seller2026LiveCategoriesPage`.
- Legacy Categories page remains available.
- Preview `/seller-2026/catalog/categories` remains available and may use preview/mock data.

## 6. Feature Flags

- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED`

Defaults remain off because env values must equal `true`.

## 7. APIs Used

- `getSellerCategories`

Existing but disabled in Seller 2026 canonical UI pending mutation smoke:
- `createSellerCategory`
- `updateSellerCategory`
- `setSellerCategoryPublished`
- `uploadSellerCategoryImage`

## 8. Categories Data Contract

Adapter normalizes:
- `id`
- `name`
- `slug`
- `description`
- `image`
- `status`
- `isPublished`
- `productCount`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `canonicalHref`

Summary normalizes:
- `total`
- `published`
- `draft`
- `empty`
- `needsAttention`
- `totalCategories`
- `totalProducts`
- `assignedRate`

Safe fallbacks:
- Missing name: `Untitled category`
- Missing slug: generated display-safe slug
- Missing description: `No description available.`
- Missing image: safe initial avatar
- Missing product count: `0`
- Invalid date: `Recently`
- Unknown unpublished status: `Draft` or `Needs review`
- Missing array: `[]`

## 9. UI States

- Header title: `Categories`
- Summary cards: Total, Published, Draft, Empty, Needs Attention
- Table/list: thumbnail, name, slug, product count, status, last updated, actions
- Loading state: `Loading categories...`
- Empty state: `No categories yet` and `Create categories to organize your products.`
- Error state: `Categories could not be loaded` with `Try again`
- Permission-safe state is handled by Seller 2026 route permission guard.
- Mobile safety uses the existing responsive `s26-table-wrap` overflow container and responsive KPI grid.

## 10. Permission Behavior

- Read/list requires `CATALOG_CATEGORY_READ`, which aliases to existing backend category/product read permissions.
- Backend remains final enforcement through `requireSellerStoreAccess(["CATEGORY_VIEW"])`.
- Mutating actions are disabled in the Seller 2026 canonical route until category lifecycle smoke is added.

## 11. Allowed Actions

Enabled:
- Read/list categories.
- Search categories.
- Open canonical product list filtered by category.

## 12. Disabled Mutations

Disabled:
- Create category.
- Edit category.
- Publish/unpublish category.
- Delete category.
- Upload image.
- Bulk category actions.
- Platform/admin category mutation.

## 13. Route Link Safety

Canonical links only:
- `/seller/stores/:storeSlug/catalog/categories`
- `/seller/stores/:storeSlug/catalog/products?category=:categoryId`
- `/seller/stores/:storeSlug/catalog/products`

No canonical route links to `/seller-2026`.

## 14. Cross-Store Behavior

Cross-store access remains guarded by `SellerLayout` seller context resolution and backend store access checks. Smoke verifies forbidden-safe UI for owner of `tp-preneurs-demo-store` opening `other-demo-store`.

## 15. Preview Behavior

- `/seller-2026/catalog/categories` remains alive.
- Preview may use mock/preview data.
- Canonical route does not use `seller2026Data.js` for categories data when flags are on.

## 16. Smoke Results

Smoke script added:
- `scripts/seller2026-categories-adoption-smoke.ts`

Covered:
- Flags off runtime
- Flags on runtime
- Owner session
- Role-limited member
- Cross-store guard
- Preview route
- Product Catalog regression
- Product Authoring regression
- Product Detail regression
- Dashboard regression
- Notifications regression
- Admin regression
- Client regression
- No category mutation request from canonical route

Result:
- Categories adoption smoke: PASS
- Fatal console errors: 0
- Page errors: 0
- Category mutation requests: 0
- Expected cross-store 403 console entry: safe

## 17. Typecheck/Build/Lint Result

Commands:
- `pnpm.cmd -F client exec tsc -b`: PASS
- `pnpm.cmd -F client build`: PASS
- `pnpm.cmd -F server build`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-categories-adoption-smoke.ts`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-authoring-hardening-smoke.ts`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-product-detail-adoption-smoke.ts`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-catalog-adoption-smoke.ts`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-dashboard-adoption-smoke.ts`: PASS
- `pnpm.cmd exec tsx scripts/seller2026-notifications-hardening-smoke.ts`: PASS
- `pnpm.cmd -F client exec eslint src/api/seller2026/catalog.adapter.ts src/features/seller2026/Seller2026Workspace.jsx`: PASS with one warning that the `.jsx` file is ignored by active ESLint config
- `git diff --check`: PASS

Build note:
- Vite still reports existing chunk-size warnings for large chunks.

## 18. Bugs Fixed

- Hardened Seller 2026 Categories adapter to include required category row and summary fields.
- Removed non-English copy from live Categories UI.
- Added canonical product links instead of preview route links.
- Changed unsafe category mutations to disabled/guarded actions in Seller 2026 canonical UI.
- Added repeatable categories adoption smoke.

## 19. Known Limitations

- Category create/edit/status mutations are not enabled yet because disposable mutation lifecycle and cleanup are not covered by this task smoke.
- Store-scoped `/seller-2026-preview/:storeSlug/catalog/categories` is not registered as a dedicated preview route.
- Repo-wide lint debt remains outside this task scope.

## 20. Rollback Notes

Rollback is feature flag based:
- Set `VITE_SELLER_WORKSPACE_2026_ENABLED=false`, or
- Set `VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED=false`

The canonical route then renders `SellerCategoriesPage`.

## 21. Next Recommended Task

`SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTES-09`
