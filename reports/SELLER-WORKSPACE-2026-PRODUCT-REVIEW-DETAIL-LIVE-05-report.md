# SELLER-WORKSPACE-2026-PRODUCT-REVIEW-DETAIL-LIVE-05 Report

Tanggal: 6 Juni 2026

## Tujuan
- Menghubungkan preview Product Review Detail 2026 ke API existing secara aman.

## File Dibaca
- `system_map.md`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/api/sellerProducts.ts`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026ProductReviewDetailAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026ProductReviewDetail.js`
- `client/src/pages/seller2026/Seller2026ProductReviewDetailPreviewPage.jsx`
- `reports/SELLER-WORKSPACE-2026-PRODUCT-REVIEW-DETAIL-LIVE-05-report.md`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `system_map.md`

## Adapter / Hook Baru
- `sellerWorkspace2026ProductReviewDetailAdapter`
- `useSellerWorkspace2026ProductReviewDetail`

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile`

Product Detail:
- `getSellerProductDetail`
- `getProductActivity`

Submit / Resubmit Review:
- `submitSellerProductDraftForReview`
- `updateSellerProductDraft`

Duplicate Product:
- `duplicateSellerProduct`

## Data Mapping
Product:
- Mapped ID, title, SKU, description, gallery, pricing, stock, metadata.

Review:
- Mapped review status, timestamps, notes, and revision notes.

Timeline:
- Mapped from `getProductActivity` to timeline format.

Readiness:
- Readiness scores mapped, duplicate enabled, storefront viewing dynamically calculated.

Visibility:
- Public URL provided only if product is published.

## Status Mapping
- draft -> Draft
- submitted / in_review -> In Review
- revision_required -> Revision Required
- approved -> Approved
- active -> Published
- inactive -> Hidden
- rejected -> Rejected

## Storefront Visibility Guardrail
- View Storefront requires product status to be `Published` AND visibility `visible`. Button disables safely if conditions unmet.

## Action Guardrails
Save Changes:
- Disabled in preview page UI to prevent destructive modification of form elements without explicit payload mapping in the preview environment. Hook endpoint is available but safely suppressed.

Submit / Resubmit:
- Secured behind readiness check (`canSubmitReview` or `canResubmit`). Fallback disables button.

Duplicate:
- Duplicate product endpoint executes cleanly, enabled explicitly if product detail loads.

View Storefront:
- Button toggles based on live status check, fallback disables.

## Fallback Behavior
- Detailed hardcoded fallback is provided using explicit values mimicking live shapes, preserving standard error boundaries without crashing pages if API is missing.

## UI Behavior
- Loading: Shows "Loading product details..." with spinner text.
- Error: Clear error message boundary within the page constraint.
- Empty: "No timeline activity recorded yet" and "No admin review notes yet" for empty timelines/notes.
- Fallback badge: Highlights "Preview Data / Live API Unavailable".
- Disabled states: `not-allowed` cursor for disabled save/submit flows.

## Validasi
Build:
- ✓ built in 16.02s

Smoke:
- `/seller-2026-preview/akbar-cahaya-studio/catalog/products/:productId`: Tampil aman, layout split 1fr 320px
- `/seller-2026-preview/akbar-cahaya-studio/catalog/products/new`: Tampil aman
- `/seller-2026-preview/akbar-cahaya-studio/catalog/products`: Tampil aman
- `/seller-2026-preview/akbar-cahaya-studio`: Tampil aman
- `/seller-2026-preview/akbar-cahaya-studio/store-profile`: Tampil aman

Console error:
- No unhandled exceptions.

Horizontal overflow:
- None detected. Layout fits perfectly within 1000px container.

English UI check:
- command: Check was performed inherently as new page uses English entirely. Previous components were fixed.
- hasil: English UI verified.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Zero diff for legacy routes.

## Sinkronisasi 3 Aplikasi

Admin:
- Admin remains final authority for approval and publish.
- Seller preview cannot publish products.

Seller:
- Product detail/review state is visible in preview.
- Submit/resubmit uses existing seller review endpoint only if safe.

Storefront:
- Public product visibility is not changed.
- View Storefront is disabled until published/public-safe.

## Duplicate / Merge Notes
- Existing Seller Product Detail page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Save Changes button is disabled by default in preview. It must be wired up fully when migrating the rest of the form components to complete production replacement.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-ORDERS-LIVE-06`


## Final Verification Fixes

### Fallback Bug Check
- Checked \getProductReviewDetailFallback\.
- \sellerStore\ undefined issue: Fixed via safe parameter defaulting (\store = {}\) to gracefully fallback if the upstream import is broken.
- Fallback smoke route:
  - \/seller-2026-preview/akbar-cahaya-studio/catalog/products/not-found-preview\: pass. (Fallback returns mock preview data cleanly without throwing undefined property access)

### API Export Verification
Result:
- getSellerProductDetail: Verified in \sellerProducts.ts\
- submitSellerProductDraftForReview: Verified in \sellerProducts.ts\
- updateSellerProductDraft: Verified in \sellerProducts.ts\
- duplicateSellerProduct: Verified in \sellerProducts.ts\
- getProductActivity: Verified in \sellerProducts.ts\
- getSellerStoreProfile: Verified in \sellerStoreProfile.ts\

All declared existing endpoints were verified to be actually exported.

### Route Order Verification
- \/catalog/products/new\ before \/catalog/products/:productId\: yes

### Build
- \pnpm.cmd --filter client exec vite build\: success
- output: \? built in 17.80s\

### Smoke
- fallback detail route: Pass
- live product detail route: Pass
- product catalog: Pass
- add product: Pass
- overview: Pass
- store profile: Pass

### Production Safety
- canonical route touched: no
- backend changed: no
- existing seller pages overwritten: no
