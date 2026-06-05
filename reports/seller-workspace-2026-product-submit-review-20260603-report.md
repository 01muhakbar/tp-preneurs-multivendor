# Seller Workspace 2026 Product Submit Review Report

## Scope
- Enabled Seller 2026 product submit review on live product list, detail, and edit routes.
- Kept preview `/seller-2026/products` mock-only.
- Kept direct publish/unpublish, delete/archive, bulk submit, media upload, variant persistence, and admin review actions disabled.

## Product Submit Review Contract
- UI route surfaces:
  - `/seller/stores/:storeSlug/catalog/products`
  - `/seller/stores/:storeSlug/catalog/products/:productId`
  - `/seller/stores/:storeSlug/catalog/products/:productId/edit`
- API endpoint:
  - `POST /api/seller/stores/:storeId/products/:productId/submit-review`
- Backend guard:
  - `requireSellerStoreAccess(["PRODUCT_EDIT"])`
- Request payload:
  - none
- Backend ownership:
  - product is loaded by `{ id: productId, storeId }`
- Backend lifecycle:
  - draft-only submit
  - already-submitted drafts rejected
  - seller submission metadata and product activity log written

## Product Governance Boundary
- Seller 2026 submit review only moves draft products into admin review.
- Mutation flag `productSubmitReview` is enabled for this action; broad product mutation flag `products` remains false.
- Seller 2026 does not publish products directly.
- Seller 2026 does not approve/reject/revise seller submissions.
- Seller 2026 does not expose destructive product delete/archive in this pass.

## Files Changed
- `client/src/api/seller2026/mutation-flags.ts`
- `client/src/api/seller2026/permissions.ts`
- `client/src/api/seller2026/products.adapter.ts`
- `client/src/api/seller2026/products.mutations.ts`
- `client/src/features/seller2026/Seller2026Workspace.jsx`
- `client/src/hooks/seller2026/useSeller2026SubmitProductReview.ts`
- `client/src/pages/seller2026/Seller2026LiveProductsPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductDetailPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveProductEditorPage.jsx`
- `scripts/seller2026-auth-fixture-live-smoke.ts`
- `docs/seller-2026/MUTATION_INTEGRATION.md`
- `docs/seller-2026/PERMISSION_MATRIX.md`
- `docs/seller-2026/HARDENING_AUDIT.md`
- `docs/seller-2026/IMPLEMENTATION_NOTES.md`
- `system_map.md`

## Fixture / Smoke Mutation
- Smoke fixture resets `S26-DRAFT` to `status: "draft"`, `isPublished: false`, and `sellerSubmissionStatus: "none"`.
- Smoke visits the live edit route for that fixture product.
- Smoke clicks `Submit Review`.
- Smoke asserts success copy and verifies no direct `Publish` button is exposed.

## Verification
- `pnpm.cmd -F client exec tsc -b` PASS
- `pnpm.cmd -F client exec eslint src/features/seller2026 src/pages/seller2026 src/hooks/seller2026 src/api/seller2026 src/routes/seller2026RouteConfig.jsx` PASS with one existing ignored-file warning for `src/routes/seller2026RouteConfig.jsx`
- `pnpm.cmd -F client build` PASS
- `pnpm.cmd exec tsx scripts/seller2026-auth-fixture-live-smoke.ts` PASS

## Smoke Result
- Product submit review fixture product id: `2136`
- Product submit review UI result: `PASS`
- Product submit review API observed: `POST /api/seller/stores/1436/products/2136/submit-review` -> `200`
- Direct publish button assertion: `PASS`

## Pending Work
- Bulk submit review.
- Product readiness checklist before submit review.
- Media upload and variant matrix persistence.
- Admin review lifecycle integration.
- Product archive/delete confirmation and fixture rollback.
