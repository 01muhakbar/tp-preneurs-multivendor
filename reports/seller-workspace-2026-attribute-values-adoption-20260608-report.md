# Seller Workspace 2026 Attribute Values Adoption Report

Task ID: `SELLER-WORKSPACE-2026-PROD-ADOPT-ATTRIBUTE-VALUES-10`

## Status

PASS

## AMATI

File dibaca:
- `client/src/App.jsx`
- `client/src/layouts/SellerLayout.jsx`
- `client/src/utils/sellerWorkspaceRoute.js`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller/SellerAttributeValuesPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/api/sellerAttributes.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/hooks/seller2026/useSeller2026AttributeValues.ts`
- `server/src/routes/seller.attributes.ts`
- `scripts/seller2026-attributes-adoption-smoke.ts`
- `system_map.md`

Fitur yang sudah ada:
- Canonical route `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` already exists.
- Flags off render legacy `SellerAttributeValuesPage`.
- Flags on render `Seller2026LiveAttributeValuesPage` using `VITE_SELLER_WORKSPACE_2026_ENABLED` and `VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED`.
- Existing seller API supports list/create/update/delete attribute values.
- Backend create/update value payload accepts `value`.
- Backend delete can archive used values but can hard-delete unused values.

Gap yang ditemukan:
- Seller 2026 Attribute Values page was read-only.
- Add/Edit Value controls were disabled although safe create/update endpoints exist.
- Adapter did not expose enough value context for a production-grade values table.
- Publish/unpublish has no dedicated value status endpoint.
- Delete is unsafe to expose because hard-delete is possible.

Risiko perubahan:
- Create/update must stay payload-compatible with existing backend contract.
- UI must not expose destructive delete or unsupported status governance.
- Role-limited and cross-store sessions must not send mutation requests.

## TIRU

Pola existing yang ditiru:
- React Query mutation wiring from Seller 2026 Categories/Attributes live pages.
- `catalogMutation` handoff pattern into `Seller2026Workspace`.
- Existing seller API service layer in `client/src/api/sellerAttributes.ts`.
- Existing Seller 2026 modal, table, KPI, empty, loading, error, disabled action, and permission styles.
- Existing Playwright smoke fixture/auth pattern from Seller 2026 adoption smokes.

API/service/component/hook yang dipakai ulang:
- `useSellerWorkspaceRoute`
- `getSeller2026PagePermissions`
- `useSeller2026AttributeValues`
- `getSellerAttributeValues`
- `createSellerAttributeValue`
- `updateSellerAttributeValue`
- `Seller2026Workspace`
- `DataTable`, `Card`, `CatalogKpi` local workspace primitives

## MODIFIKASI

File diubah:
- `client/src/api/sellerAttributes.ts`
- `client/src/api/seller2026/catalog.adapter.ts`
- `client/src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `scripts/seller2026-attribute-values-adoption-smoke.ts`
- `system_map.md`
- `reports/seller-workspace-2026-attribute-values-adoption-20260608-report.md`

File yang tidak disentuh untuk task ini:
- Backend route/schema/model/migration.
- Auth/session/permission backend.
- Payment/order/shipping modules.
- Admin Workspace and Client/storefront rendering.
- Existing legacy seller attribute values page.

QA yang dijalankan:
- `pnpm.cmd -F client exec tsc -b`
- `pnpm.cmd -F client build`
- `pnpm.cmd -F server build`
- `pnpm.cmd exec tsx scripts/seller2026-attribute-values-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-catalog-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-dashboard-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-authoring-hardening-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-product-detail-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-notifications-hardening-smoke.ts`
- `pnpm.cmd -F client exec eslint src/api/sellerAttributes.ts src/api/seller2026/catalog.adapter.ts src/hooks/seller2026/useSeller2026AttributeValues.ts src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx src/features/seller2026/Seller2026Workspace.jsx`
- `git diff --check`

## Perubahan

Admin:
- No Admin Workspace change.

Seller:
- Canonical route remains `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values`.
- Flags off still render legacy `SellerAttributeValuesPage`.
- Flags on render Seller 2026 live `Seller2026LiveAttributeValuesPage`.
- Attribute Values page now has live overview KPIs, attribute context, search/status controls, and production-style table.
- Add Value and Edit Value are enabled when the user has `ATTRIBUTE_MANAGE`.
- Create/update use existing live APIs and refetch after success.
- Success/error status remains visible after modal close.
- Publish/unpublish buttons are disabled with reason because no value status endpoint exists.
- Delete button is disabled with reason because backend delete can hard-delete unused values.
- Description, color, image, bulk, import, and export remain disabled/read-only pending safe metadata/storage governance.

Client/storefront:
- No Client/storefront change.
- Public storefront customization/product rendering is untouched.

Backend:
- No backend change.
- Existing endpoints observed:
  - `GET /api/seller/stores/:storeId/attributes/:attributeId/values`
  - `POST /api/seller/stores/:storeId/attributes/:attributeId/values`
  - `PATCH /api/seller/stores/:storeId/attributes/values/:valueId`
  - `DELETE /api/seller/stores/:storeId/attributes/values/:valueId` stays unexposed in UI.

## Mutations

Create:
- Enabled and smoke-tested for owner.
- Payload is whitelisted to `{ value }`.

Update:
- Enabled and smoke-tested for owner.
- Payload is whitelisted to `{ value }`.

Publish/unpublish:
- Disabled/read-only with reason: no value status endpoint/governance is available.

Delete:
- Disabled/read-only with reason: existing delete may hard-delete unused values.

Cleanup:
- Smoke cleanup renames the disposable value to `-CLEANED`; no delete request is sent.

## QA Result

PASS:
- `pnpm.cmd -F client exec tsc -b`
- `pnpm.cmd -F client build`
- `pnpm.cmd -F server build`
- `pnpm.cmd exec tsx scripts/seller2026-attribute-values-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-catalog-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-dashboard-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-authoring-hardening-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-product-detail-adoption-smoke.ts`
- `pnpm.cmd exec tsx scripts/seller2026-notifications-hardening-smoke.ts`
- Targeted ESLint PASS with two existing config warnings where `.jsx` files are ignored.
- `git diff --check` PASS with existing CRLF warning for `client/src/features/seller2026/Seller2026DesignSystem.css`.

Attribute Values smoke summary:
- Flags off legacy fallback: PASS.
- Flags on live marker: PASS.
- Owner create value: PASS.
- Owner update value: PASS.
- Publish/unpublish disabled guard: PASS.
- Delete disabled guard: PASS.
- Back to Attributes canonical link: PASS.
- Member no-mutation guard: PASS.
- Cross-store guard: PASS.
- Missing attribute guard: PASS.
- Preview route: PASS.
- Regression routes for attributes, categories, catalog, authoring, product detail, dashboard, notifications, admin, and client: PASS.
- Owner mutation summary: 1 POST, 2 PATCH, 0 DELETE.

Known regression note:
- `scripts/seller2026-attributes-adoption-smoke.ts` was run separately and failed waiting for `Attribute published.`. Attribute route regression itself PASS in the Attribute Values smoke. This appears tied to the older Attributes status-message smoke path, not to Attribute Values adoption.
- Full categories mutation smoke was not rerun because a status-action polling/fallback flake was already known from the previous task; category route regression PASS in the Attribute Values smoke.

## Sinkronisasi

Admin:
- Unchanged.

Backend:
- Unchanged; existing seller attribute value endpoints are reused.

Client/storefront:
- Unchanged.

Seller:
- Route, flags, live API wiring, permission gates, and mutation guards are synchronized.

## Risiko Tersisa

- Value publish/unpublish remains unavailable until backend exposes a safe value status contract.
- Value delete remains unavailable until destructive behavior is reviewed.
- Description/color/image value metadata is presentational/read-only because the existing safe write contract only supports `value`.
- Repo has unrelated dirty files from previous tasks; this task did not revert or normalize them.
- Existing Attributes adoption smoke has a message-wait failure on publish status outside this task's values route.

## Next Recommendation

- `SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-11`
