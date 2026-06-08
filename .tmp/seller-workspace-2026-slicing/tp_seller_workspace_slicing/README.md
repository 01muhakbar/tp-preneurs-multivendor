# Seller Workspace 2026 Slicing Package

Target repo: `tp-preneurs-multivendor-main`  
Focus: Multi-Vendor Seller Workspace  
Language: English UI labels  
Status: UI slicing package, safe to implement incrementally.

This package translates the generated mockups into React/Vite slicing code without deleting or replacing the existing Seller Workspace. It follows the `system_map.md` guardrail: audit first, keep existing features, do not remove duplicate/legacy features directly, and integrate progressively.

## Package Contents

```txt
client/src/features/sellerWorkspace2026/
  SellerWorkspace2026.jsx
  SellerWorkspace2026.css
  sellerWorkspace2026Data.js
  index.js

client/src/pages/seller2026/
  SellerWorkspace2026DemoPage.jsx
  Seller2026OverviewPage.jsx
  Seller2026StoreProfilePage.jsx
  Seller2026ProductCatalogPage.jsx
  Seller2026ProductAuthoringPage.jsx
  Seller2026ProductReviewDetailPage.jsx
  Seller2026OrdersPage.jsx
  Seller2026PaymentCenterPage.jsx
  Seller2026CouponsPromotionsPage.jsx
  Seller2026TeamAccessPage.jsx
  Seller2026AnalyticsSyncPage.jsx
  index.js

assets/mockups/
  01-overview-dashboard.png
  02-store-profile.png
  03-product-catalog.png
  04-product-authoring.png
  05-product-review-detail.png
  06-orders.png
  07-payment-center.png
  08-coupons-promotions.png
  09-team-access.png
  10-analytics-sync.png

docs/
  SELLER_WORKSPACE_2026_INTEGRATION_GUIDE.md

reports/
  SELLER-WORKSPACE-2026-SLICING-01-report.md
```

## Covered Screens

1. Overview / Dashboard
2. Store Profile
3. Product Catalog
4. Product Authoring / Add Product
5. Product Review Detail / Submit Review
6. Orders / Fulfillment Operations
7. Payment Center / Payment Review + Payout Profile
8. Coupons & Promotions
9. Team & Access
10. Analytics & Storefront Sync

## Safe Implementation Strategy

1. Copy the `client/src/features/sellerWorkspace2026` folder into the repo.
2. Copy the `client/src/pages/seller2026` folder into the repo.
3. Add temporary preview routes only. Do not replace existing production Seller routes immediately.
4. Validate the UI and compare it with existing Seller pages.
5. Gradually map live API data from existing `client/src/api/seller*.ts` clients.
6. Only after smoke validation, decide whether each existing page should be updated, wrapped, or left untouched.

## Dependencies

The code only uses dependencies already present in the repo client package:

- `react`
- `lucide-react`

No new dependency is required.

## Notes

This slicing package is intentionally frontend-only. It uses mock data in `sellerWorkspace2026Data.js` so it can be previewed safely before connecting live APIs.
