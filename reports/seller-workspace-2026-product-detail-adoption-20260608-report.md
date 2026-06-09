# SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-06 Report

## 1. Task Scope
Adopsi Product Detail Seller Workspace 2026 ke canonical production route secara aman, read-only-first, live API connected, feature-flagged, rollbackable, dan tanpa mock data.
Route: `/seller/stores/:storeSlug/catalog/products/:productId`

## 2. Route Adoption Behavior
- Flag OFF: Render `SellerProductDetailPage` (Legacy)
- Flag ON: Render `Seller2026LiveProductDetailPage` (Seller 2026 Live)
- Mode: `embedded` (merender Product Detail List tanpa Shell header & sidebar)
- Mutation actions (e.g. submitReview) disabled in this canonical route via `productsMutation={undefined}`.

## 3. API & Data Contract
- Data diambil via `useSeller2026ProductDetail`.
- Normalizer: `adaptSeller2026ProductDetail` telah di-update untuk me-normalize:
  - Product identity: `id, slug, name, sku, shortDescription, description, thumbnail, gallery, category, tags`
  - Pricing: `price, salePrice, currency, discountLabel`
  - Inventory: `stock, stockStatus, lowStockThreshold, inventoryPolicy`
  - Status/governance: `status, visibility, submissionStatus, approvalStatus, isPublished, isDraft, isArchived, needsAttention, revisionNotes, lastSubmittedAt, approvedAt, rejectedAt`
  - Operational metadata: `createdAt, updatedAt, createdBy, updatedBy`
  - Navigation: `canonicalListHref, canonicalEditHref, canonicalStorefrontHref, canonicalCategoryHref`

## 4. Smoke Results
- Typecheck: PASS
- Build: PASS
- Flags off runtime: PASS
- Flags on runtime: PASS
- Owner session: PASS
- Role-limited member: PASS
- Cross-store guard: PASS
- Catalog/Dashboard/Admin regression: PASS
