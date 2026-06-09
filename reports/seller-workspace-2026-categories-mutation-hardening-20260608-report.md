# SELLER-WORKSPACE-2026-CATEGORIES-MUTATION-HARDENING-08B Report

## 1. Task Title
SELLER-WORKSPACE-2026-CATEGORIES-MUTATION-HARDENING-08B.

## 2. Scope
Enabled safe category create, update, and publish/unpublish mutations on the canonical Seller Workspace 2026 route `/seller/stores/:storeSlug/catalog/categories` behind existing flags. Backend schema, auth, permission model, Admin Workspace, Client Storefront, order, payment, and shipping behavior were not changed.

## 3. Files Read
- `system_map.md`
- `reports/seller-workspace-2026-categories-adoption-20260608-report.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Categories.ts`
- `client/src/api/sellerCategories.ts`
- `server/src/routes/seller.categories.ts`
- `scripts/seller2026-categories-adoption-smoke.ts`

## 4. Files Changed
- `client/src/api/sellerCategories.ts`
- `client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `scripts/seller2026-categories-mutation-hardening-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-categories-mutation-hardening-20260608-report.md`

## 5. Manual Screenshot Finding
- Add Category was visible in Seller 2026 categories UI and needed permission-aware mutation wiring.
- Update Category modal existed and needed store-scoped submit behavior.
- Published toggle/action needed to use the existing status endpoint, not generic update form state.
- Image upload needed a guard because the available upload helper points to a generic `/upload` route.
- Bulk, Import, and Export controls needed to remain disabled with explicit English reasons.

## 6. Mutation Decision
Canonical decision: `CATEGORY_MUTATIONS_ENABLED_WITH_GUARDRAILS`.

## 7. Endpoint Audit
- List: `GET /api/seller/stores/:storeId/categories`, permission `CATEGORY_VIEW`, store access resolved by backend middleware.
- Create: `POST /api/seller/stores/:storeId/categories`, permission `CATEGORY_MANAGE`, response `{ success, data }`.
- Update: `PUT /api/seller/stores/:storeId/categories/:categoryId`, permission `CATEGORY_MANAGE`, response `{ success, data }`.
- Publish/unpublish: `PATCH /api/seller/stores/:storeId/categories/:categoryId/publish`, permission `CATEGORY_MANAGE`, response `{ success, data }`.
- Upload image: client helper exists for generic `POST /upload`; not enabled because store-scoped validation was not proven.
- Delete/deactivate: no safe Seller 2026 delete/deactivate action enabled.

## 8. Feature Flags
- Flags off: `/seller/stores/:storeSlug/catalog/categories` resolves to legacy `SellerCategoriesPage`.
- Flags on: route resolves to `Seller2026LiveCategoriesPage` with guarded mutations.
- Production env defaults were not changed.

## 9. APIs Used
- `getSellerCategories`
- `createSellerCategory`
- `updateSellerCategory`
- `setSellerCategoryPublished`
- `useSeller2026Categories`
- `adaptSeller2026Categories`

## 10. Whitelisted Payload
Create/update payload is normalized to safe fields only:
- `name`
- `description`
- `parentId`
- `image` only when already present from trusted state/helper
- `isPublished` only on create

## 11. Blocked Payload Fields
The UI does not send user-controlled `storeId`, `ownerId`, `vendorId`, `createdBy`, `updatedBy`, `adminStatus`, `platformCategory`, `isPlatform`, `productCount`, raw permissions, arbitrary metadata, storefront overrides, or cross-store identifiers.

## 12. Create Category Flow
Owner with `CATEGORY_MANAGE` can open Add Category, enter name/description/parent, optionally set initial published state, and submit through `createSellerCategory`. Success closes the modal, refetches list data, and shows `Category created.`. Failure keeps the modal input and shows backend/client error copy.

## 13. Update Category Flow
Owner with `CATEGORY_MANAGE` can open row Edit, update name/description/parent, and submit through `updateSellerCategory`. Status is shown but handled separately by row action. Success closes the modal, refetches list data, and shows `Category updated.`.

## 14. Publish/Unpublish Decision
Publish/unpublish is enabled through `setSellerCategoryPublished`, using the existing `PATCH /publish` endpoint. Smoke validated the owner status mutation and final unpublished state.

## 15. Image Upload Guard Decision
Image upload remains disabled. Reason shown in UI: `Category image upload is disabled until storage validation is complete.` This avoids fake upload success and avoids routing category media through a generic non-store-scoped upload flow.

## 16. Permission Behavior
Owner can create/update/status-change when backend exposes `CATEGORY_MANAGE`. Role-limited member sees mutation controls disabled and smoke confirmed no mutation request is sent.

## 17. Cross-Store Behavior
Owner of `tp-preneurs-demo-store` opening `other-demo-store` receives forbidden-safe UI. Smoke confirmed no cross-store category mutation request succeeded.

## 18. Cleanup Fixture Strategy
Smoke creates `S26-CAT-SMOKE-${timestamp}`, updates it, status-mutates it to unpublished, then renames it to `S26-CAT-SMOKE-${timestamp}-CLEANED`. No hard delete is used.

## 19. Disabled Actions
- Hard delete category.
- Bulk category actions.
- Import categories.
- Export categories.
- Platform/admin category mutation.
- Cross-store category mutation.
- Category image upload until storage validation is reviewed.

## 20. UI States
The categories UI includes live loading/error/empty states, mutation pending states, success/error messages, disabled action reasons, mobile-safe modal sizing, permission-safe controls, and English-only copy for touched category mutation surfaces.

## 21. Smoke Results
- `pnpm.cmd exec tsx scripts/seller2026-categories-mutation-hardening-smoke.ts`: PASS.
- Flags off runtime: PASS.
- Flags on runtime: PASS.
- Owner create: PASS.
- Owner update: PASS.
- Owner publish/unpublish: PASS.
- Image upload guard: PASS as disabled pending storage validation.
- Role-limited member: PASS.
- Cross-store guard: PASS.
- Cleanup fixture: PASS, renamed and unpublished.
- Regression inside categories smoke: PASS.
- Authoring hardening smoke: PASS.
- Product detail adoption smoke: PASS.
- Catalog adoption smoke: PASS.
- Dashboard adoption smoke: PASS.
- Notifications hardening smoke: PASS.

## 22. Typecheck/Build/Lint Results
- `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS with existing Vite chunk-size warnings.
- `pnpm.cmd -F server build`: PASS.
- Targeted ESLint touched files: PASS with config warnings for ignored JSX/CSS files, no errors.
- `git diff --check`: PASS with line-ending warning for existing CSS checkout behavior.

## 23. Bugs Fixed
- Removed `any` from touched category API normalization.
- Added payload whitelist/sanitizer for create/update category calls.
- Preserved category success message after modal close.
- Fixed React Query pending IDs so update completion does not leave category action buttons disabled.
- Hardened smoke flag mocking to toggle both global Seller 2026 and categories flags.

## 24. Known Limitations
- Category image upload remains disabled until a store-scoped storage validation path is approved and smoke-tested.
- No hard delete is exposed; cleanup uses rename plus unpublished state.
- Bulk/import/export remain disabled pending dedicated governance and endpoint review.

## 25. Rollback Notes
Set either `VITE_SELLER_WORKSPACE_2026_ENABLED=false` or `VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED=false` to render legacy Categories on the canonical route. No backend rollback is required because no backend code/schema/auth change was made.

## 26. Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTES-09`.
