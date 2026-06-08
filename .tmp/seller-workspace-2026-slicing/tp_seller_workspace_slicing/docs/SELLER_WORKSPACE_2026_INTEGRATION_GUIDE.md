# Seller Workspace 2026 Integration Guide

## Goal

Implement the generated Multi-Vendor Seller Workspace mockups as a safe, modular React slicing layer for `tp-preneurs-multivendor-main`, using English UI labels and preserving the existing Seller/Admin/Storefront boundaries.

## Guardrails

- Do not delete existing seller pages.
- Do not remove legacy routes yet.
- Do not bypass Admin review/publish/payment authority.
- Do not replace live APIs with mock data in production paths.
- Use this slicing first as preview/demo routes.
- Connect live API clients incrementally.

## Recommended Preview Routes

Add imports to `client/src/App.jsx`:

```jsx
import {
  SellerWorkspace2026DemoPage,
  Seller2026OverviewPage,
  Seller2026StoreProfilePage,
  Seller2026ProductCatalogPage,
  Seller2026ProductAuthoringPage,
  Seller2026ProductReviewDetailPage,
  Seller2026OrdersPage,
  Seller2026PaymentCenterPage,
  Seller2026CouponsPromotionsPage,
  Seller2026TeamAccessPage,
  Seller2026AnalyticsSyncPage,
} from './pages/seller2026';
```

Add preview-only routes near existing seller routes:

```jsx
<Route path="/seller-2026-preview" element={<SellerWorkspace2026DemoPage />} />
<Route path="/seller-2026-preview/overview" element={<Seller2026OverviewPage />} />
<Route path="/seller-2026-preview/store-profile" element={<Seller2026StoreProfilePage />} />
<Route path="/seller-2026-preview/catalog/products" element={<Seller2026ProductCatalogPage />} />
<Route path="/seller-2026-preview/catalog/products/new" element={<Seller2026ProductAuthoringPage />} />
<Route path="/seller-2026-preview/catalog/products/:productId" element={<Seller2026ProductReviewDetailPage />} />
<Route path="/seller-2026-preview/orders" element={<Seller2026OrdersPage />} />
<Route path="/seller-2026-preview/payment-center" element={<Seller2026PaymentCenterPage />} />
<Route path="/seller-2026-preview/coupons" element={<Seller2026CouponsPromotionsPage />} />
<Route path="/seller-2026-preview/team" element={<Seller2026TeamAccessPage />} />
<Route path="/seller-2026-preview/analytics-sync" element={<Seller2026AnalyticsSyncPage />} />
```

## Mapping to Existing Canonical Routes

After preview validation, map each screen to existing canonical Seller routes from `system_map.md`:

| Slicing Screen | Existing Canonical Route | Existing Page Candidate |
|---|---|---|
| Overview | `/seller/stores/:storeSlug` | `SellerWorkspaceHome.jsx` |
| Store Profile | `/seller/stores/:storeSlug/store-profile` | `SellerStoreProfilePage.jsx` |
| Product Catalog | `/seller/stores/:storeSlug/catalog/products` | `SellerCatalogPage.jsx` |
| Product Authoring | `/seller/stores/:storeSlug/catalog/products/new` | `SellerProductAuthoringPage.jsx` |
| Product Review Detail | `/seller/stores/:storeSlug/catalog/products/:productId` | `SellerProductDetailPage.jsx` |
| Orders | `/seller/stores/:storeSlug/orders` | `SellerOrdersPage.jsx` |
| Payment Center | `/seller/stores/:storeSlug/payment-review` + `/payment-profile` | `SellerPaymentReviewPage.jsx`, `SellerPaymentProfilePage.jsx` |
| Coupons | `/seller/stores/:storeSlug/catalog/coupons` | `SellerCouponsPage.jsx` |
| Team | `/seller/stores/:storeSlug/team` | `SellerTeamPage.jsx` |
| Analytics & Sync | dashboard + storefront sync surface | `SellerWorkspaceHome.jsx`, sync-related components |

## Live API Mapping Plan

Replace mock arrays in `sellerWorkspace2026Data.js` gradually:

- `sellerStore` → `sellerWorkspace.ts`, `sellerStoreProfile.ts`
- `kpis` → `seller.workspace.ts` finance summary + analytics summary
- `products` → `sellerProducts.ts`
- `orders` → `sellerOrders.ts`
- `coupons` → `sellerCoupons.ts`
- `team` → `sellerTeam.ts`, `sellerTeamAudit.ts`
- `syncChannels` → store profile/public storefront sync contracts

## Validation Checklist

Run after copying files and adding preview routes:

```bash
pnpm --filter client exec vite build
pnpm dev:client
```

Manual smoke:

- `/seller-2026-preview`
- `/seller-2026-preview/store-profile`
- `/seller-2026-preview/catalog/products`
- `/seller-2026-preview/catalog/products/new`
- `/seller-2026-preview/catalog/products/preview-id`
- `/seller-2026-preview/orders`
- `/seller-2026-preview/payment-center`
- `/seller-2026-preview/coupons`
- `/seller-2026-preview/team`
- `/seller-2026-preview/analytics-sync`

Check:

- No console error.
- No horizontal overflow at desktop width.
- Responsive fallback at tablet/mobile width.
- Existing canonical routes still work.
- Existing Seller/Admin/Storefront flows are not changed.

## Next Codex Task Prompt

```md
## TASK-ID: SELLER-WORKSPACE-2026-SLICING-INTEGRATION-01

Tujuan:
Install slicing package Seller Workspace 2026 as preview-only routes without replacing existing Seller Workspace production pages.

Batasan:
- Do not delete existing pages.
- Do not remove legacy seller redirects.
- Do not connect mock data to production routes yet.
- Keep Admin approval/publish/payment authority unchanged.
- Update `system_map.md` and create a report in `reports/`.

File wajib dibaca:
- system_map.md
- client/src/App.jsx
- client/src/layouts/SellerLayout.jsx
- client/src/pages/seller/*
- client/src/api/seller*.ts

File boleh diubah:
- client/src/features/sellerWorkspace2026/*
- client/src/pages/seller2026/*
- client/src/App.jsx only for preview routes
- reports/SELLER-WORKSPACE-2026-SLICING-INTEGRATION-01-report.md
- system_map.md

Langkah kerja:
1. Copy slicing folders into client/src.
2. Add preview-only imports and routes in App.jsx.
3. Run client build.
4. Smoke preview routes.
5. Document validation and remaining risks.

Validasi:
- pnpm --filter client exec vite build
- pnpm dev:client
- Browser smoke preview routes
- Check console error
- Check horizontal overflow

Output akhir:
- Summary
- Files read
- Files changed
- Validation results
- Remaining risks
```
