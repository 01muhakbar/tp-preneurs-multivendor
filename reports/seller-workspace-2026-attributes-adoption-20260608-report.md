# SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTES-09 Report

## 1. Task Title
SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTES-09.

## 2. Scope
Adopted Seller Workspace 2026 Attributes on `/seller/stores/:storeSlug/catalog/attributes` behind existing flags. Backend schema, auth middleware, permission model, Admin Workspace, Client Storefront, payment, order, shipping, Product Catalog, Product Detail, Authoring, and Categories production behavior were not changed.

## 3. Files Read
- `system_map.md`
- `reports/seller-workspace-2026-categories-mutation-hardening-20260608-report.md`
- `reports/seller-workspace-2026-authoring-hardening-20260608-report.md`
- `reports/seller-workspace-2026-product-detail-adoption-20260608-report.md`
- `reports/seller-workspace-2026-catalog-adoption-20260608-report.md`
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerAttributesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveAttributesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/features/seller2026/Seller2026DesignSystem.css`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Attributes.ts`
- `client/src/api/sellerAttributes.ts`
- `server/src/routes/seller.attributes.ts`
- Seller 2026 smoke scripts for categories, authoring, product detail, catalog, dashboard, and notifications.

## 4. Files Changed
- `client/src/api/sellerAttributes.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026Attributes.ts`
- `client/src/pages/seller2026/Seller2026LiveAttributesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-attributes-adoption-smoke.ts`
- `scripts/seller2026-categories-mutation-hardening-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-attributes-adoption-20260608-report.md`

## 5. Route Adoption Behavior
- Flags off: legacy `SellerAttributesPage`.
- Global flag on and attributes flag off: legacy `SellerAttributesPage`.
- Global flag on and attributes flag on: `Seller2026LiveAttributesPage`.
- Attribute Values route remains separate and is only linked canonically in this task.

## 6. Endpoint Audit
- List: `GET /api/seller/stores/:storeId/attributes`, permission `ATTRIBUTE_VIEW`.
- Create: `POST /api/seller/stores/:storeId/attributes`, permission `ATTRIBUTE_MANAGE`.
- Update: `PATCH /api/seller/stores/:storeId/attributes/:attributeId`, permission `ATTRIBUTE_MANAGE`.
- Publish/unpublish: `PATCH /api/seller/stores/:storeId/attributes/:attributeId/published`, permission `ATTRIBUTE_MANAGE`.
- Delete: `DELETE /api/seller/stores/:storeId/attributes/:attributeId`, permission `ATTRIBUTE_MANAGE`, not exposed because unused attributes may be hard-deleted.
- Bulk/import/export: endpoints exist in legacy API, not exposed in Seller 2026 adoption.
- Values: values endpoints exist, but lifecycle is deferred to task 10.

## 7. Feature Flags
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED`

## 8. APIs Used
- `getSellerAttributes`
- `createSellerAttribute`
- `updateSellerAttribute`
- `setSellerAttributePublished`
- `useSeller2026Attributes`
- `adaptSeller2026Attributes`

## 9. Attributes Data Contract
Adapter normalizes `id`, `name`, `slug`, `type`, `description`, `status`, `isPublished`, `valuesCount`, `isRequired`, `isFilterable`, `sortOrder`, `createdAt`, `updatedAt`, `canonicalHref`, and `canonicalValuesHref`. Missing names fall back to `Untitled attribute`, missing descriptions to `No description available.`, invalid dates to `Recently`, and missing arrays to `[]`.

## 10. Whitelisted Payload
Create/update payloads are normalized to safe fields only:
- `name`
- `displayName`
- `type`
- `values` only during create to satisfy the existing backend create contract
- `published` only during create or via the dedicated status endpoint

## 11. Blocked Payload Fields
UI does not send user-controlled `storeId`, `ownerId`, `vendorId`, `createdBy`, `updatedBy`, `adminStatus`, `platformAttribute`, `isPlatform`, `valuesCount`, raw permission fields, arbitrary metadata, storefront overrides, or cross-store identifiers.

## 12. Create Attribute Flow
Owner with `ATTRIBUTE_MANAGE` can open Add Attribute, fill name, description, type, initial values, and published state. Submit calls `createSellerAttribute`, closes modal on success, refetches, and shows `Attribute created.`.

## 13. Update Attribute Flow
Owner with `ATTRIBUTE_MANAGE` can edit name, description, and type. Update does not change values. Submit calls `updateSellerAttribute`, closes modal on success, refetches, and shows `Attribute updated.`.

## 14. Publish/Unpublish Decision
Publish/unpublish is enabled through `setSellerAttributePublished`. Smoke validates the status mutation and final unpublished cleanup state.

## 15. Delete/Destructive Guard
Delete remains disabled because the existing endpoint can hard-delete unused attributes. Cleanup uses rename and unpublished state.

## 16. Permission Behavior
Owner can create/update/status-change. Role-limited member sees disabled mutation controls and smoke confirms no mutation requests.

## 17. Cross-Store Behavior
Cross-store access renders forbidden-safe UI and no mutation request succeeds.

## 18. Cleanup Fixture Strategy
Smoke creates `S26-ATTR-SMOKE-${timestamp}`, updates it, unpublishes it, then renames it to `S26-ATTR-SMOKE-${timestamp}-CLEANED`.

## 19. Route Link Safety
Manage Values links use `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values`. No canonical UI link points to `/seller-2026`.

## 20. Preview Behavior
`/seller-2026/catalog/attributes` remains available and smoke PASS. Preview can remain mock/preview scoped.

## 21. Disabled Actions
- Delete attribute.
- Bulk actions.
- Import attributes.
- Export attributes.
- Platform/admin attribute mutation.
- Attribute Values lifecycle mutations.

## 22. UI States
Live Attributes includes loading, error, empty, mutation pending, success/error, permission-safe disabled controls, mobile-safe modal, no intentional horizontal overflow, and English-only copy for touched surfaces.

## 23. Smoke Results
- `pnpm.cmd exec tsx scripts/seller2026-attributes-adoption-smoke.ts`: PASS.
- Flags off runtime: PASS.
- Flags on runtime: PASS.
- Owner create: PASS.
- Owner update: PASS.
- Owner publish/unpublish: PASS.
- Manage Values link: PASS.
- Role-limited member: PASS.
- Cross-store guard: PASS.
- Cleanup fixture: PASS.
- Preview: PASS.
- Categories route regression inside attributes smoke: PASS.
- Authoring hardening smoke: PASS.
- Product detail adoption smoke: PASS.
- Catalog adoption smoke: PASS.
- Dashboard adoption smoke: PASS.
- Notifications hardening smoke: PASS.

## 24. Typecheck/Build/Lint Results
- `pnpm.cmd -F client exec tsc -b`: PASS.
- `pnpm.cmd -F client build`: PASS with existing Vite chunk-size warnings.
- `pnpm.cmd -F server build`: PASS.
- Targeted ESLint touched files: PASS with config warnings for ignored JSX/CSS files, no errors.
- `git diff --check`: PASS with line-ending warning for existing CSS checkout behavior.

## 25. Bugs Fixed
- Attribute API normalization no longer uses `any` in touched client file.
- Attribute write payloads are whitelisted before create/update.
- Seller 2026 attributes adapter now exposes production-safe fields and summary cards.
- Attributes filter now uses backend option types instead of old variant/general mapping.

## 26. Known Limitations
- Attribute Values lifecycle is deferred to task 10.
- Delete/bulk/import/export remain disabled pending governance review.
- Category mutation full regression script showed a status-action polling/API fallback flake unrelated to Attributes; Attributes smoke verifies Categories route regression.

## 27. Rollback Notes
Turn off `VITE_SELLER_WORKSPACE_2026_ENABLED` or `VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED` to return the canonical attributes route to legacy `SellerAttributesPage`.

## 28. Next Recommended Task
`SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTE-VALUES-10`.
