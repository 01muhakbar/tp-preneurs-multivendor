# SELLER-WORKSPACE-2026-PROD-ADOPT-ORDERS-20 Report

## Tujuan
- Mengadopsi Orders 2026 ke production Orders route secara feature-flagged dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026OrdersPreviewPage.jsx`
- `client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Orders.js`
- `client/src/features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan)

## File Diubah
- `client/src/App.jsx`
- `client/src/pages/seller2026/Seller2026OrdersPreviewPage.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED`
- default behavior: Menggunakan legacy Orders (`Seller2026LiveOrdersPage`) untuk rute `/seller/stores/:storeSlug/orders`
- flag on behavior: Menggunakan 2026 Orders (`Seller2026OrdersPreviewPage`) dengan `productionMode={true}`.
- flag off behavior: Fallback kembali ke halaman legacy Orders.

## Route Mapping
Production:
- `/seller/stores/:storeSlug/orders`

Preview:
- `/seller-2026-preview/:storeSlug/orders`

Legacy rollback:
- Menggunakan `Seller2026LiveOrdersPage` seperti yang ada sebelumnya.

Detail route:
- `/seller/stores/:storeSlug/orders/:suborderId` remains legacy / unchanged, if present. (Tetap menggunakan `Seller2026LiveSuborderDetailPage` tanpa flag baru, karena scope hanya list).

## Production Mode Changes
- Ditambahkan penyesuaian teks fallback banner: `Live order data is unavailable. Showing fallback data.`
- Mode preview/production title disabled states pada bulk actions dan export.
- Tidak ada teks "Preview route" yang tampil karena `productionMode` dan shell sudah mengatur UI title dengan `2026 UI`.

## Guardrail Verification
Fulfillment actions:
- Guarded: action button dibatasi berdasarkan list `allowedActions` dan lifecycle state (e.g., fallback data blocks actions, isUpdating state blocks double submission).

Tracking update:
- Guarded: membutuhkan `trackingNumber` yang tidak kosong dan validasi endpoint hanya mengarah ke seller-scoped api endpoint. Update tombol disabled jika validasi gagal.

Parent order mutation:
- Guarded: action menggunakan suborder endpoint (`updateSellerSuborderFulfillment(selectedOrder.storeId, selectedOrder.suborderId, ...)`). Tidak ada direct parent order mutation.

Bulk / Export:
- Disabled: Tombol "Bulk Shipment" dan "Export" disabled.

Payment governance:
- Tetap Admin/payment-audit owned. Halaman order hanya bersifat read-only untuk payment status.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 22.43s`

Smoke flag off:
- production orders: Menampilkan Seller2026LiveOrdersPage.
- preview orders: Menampilkan Seller2026OrdersPreviewPage.
- production store profile: Legacy / Live Storefront.
- production catalog: Legacy / Live Products.
- production add product: Legacy / Live Product Editor.
- production product detail: Legacy / Live Product Detail.

Smoke flag on:
- production orders: Menampilkan Seller2026OrdersPreviewPage dengan prop productionMode=true.
- preview orders: Tetap menampilkan Seller2026OrdersPreviewPage.
- production store profile: Menampilkan Preview Store Profile jika flag profile aktif.
- production catalog: Menampilkan Preview Catalog jika flag catalog aktif.
- production add product: Menampilkan Preview Authoring jika flag authoring aktif.
- production product detail: Menampilkan Preview Product Detail jika flag detail aktif.

Console error:
- Bebas dari error runtime akibat rendering.

Horizontal overflow:
- Responsive, tabel order dibatasi width dengan ellipsis sesuai design system 2026.

English UI:
- Sudah konsisten menggunakan teks Bahasa Inggris di UI.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: zero diff

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED=false`
- Restart/rebuild client
- Production Orders route returns to legacy Orders page
- Preview route remains available
- No backend rollback required

## Risiko Tersisa
- Tidak ada. Guardrail pada actions dan rendering suborder-level telah cukup menutupi resiko perubahan API.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-COUPONS-21`
