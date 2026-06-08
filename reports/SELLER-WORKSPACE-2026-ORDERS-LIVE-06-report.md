# SELLER-WORKSPACE-2026-ORDERS-LIVE-06 Report

Tanggal: 2026-06-06
Branch/Commit jika ada:

## Tujuan
- Menghubungkan preview Orders 2026 ke API existing secara aman.

## File Dibaca
- `client/src/api/sellerOrders.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OrdersAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Orders.js`
- `client/src/pages/seller2026/Seller2026OrdersPreviewPage.jsx`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## Adapter / Hook Baru
- `sellerWorkspace2026OrdersAdapter.js`: Menerjemahkan respons endpoint `getSellerSuborders` dan `getSellerSuborderDetail` ke format UI preview yang sederhana.
- `useSellerWorkspace2026Orders.js`: Menghandle status React, loading, fallback, dan validasi actions.

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile`

Orders/Suborders:
- `getSellerSuborders`
- `getSellerSuborderDetail`

Fulfillment:
- `updateSellerSuborderFulfillment`

Tracking:
- Menggunakan `updateSellerSuborderFulfillment` dengan payload tracking khusus.

## Data Mapping
Order:
- Items di-map ke model sederhana `productSummary` dan total. Channel dimuat dari `checkoutMode`.

Selected Order Detail:
- Memuat profil `customer`, array `products` rinci dengan `totalPrice`, alamat, dan notes operasional.

Timeline:
- Diambil dari `shipments[0]?.trackingEvents`.

Summary:
- Dihitung secara manual dari list order (fallback to API aggregation if implemented). 

## Status Mapping
- fulfillmentStatus: New (pending/unfulfilled), Processing (processing), Ready to Ship (ready_to_ship), Shipped (shipped), Completed (delivered), Cancelled (cancelled).
- paymentStatus: Paid (paid/payment_verified), Pending (pending), COD (cod), Failed (failed).

## Fulfillment Guardrail
Update Status:
- Melalui endpoint `updateSellerSuborderFulfillment`. Tombol di-disable jika fallback aktif atau role/governance tidak mengizinkan aksi.
- Mengecek list `allowedActions` dari read model `governance.fulfillment.availableActions`.

Input Tracking:
- Melalui endpoint yang sama dengan `MARK_SHIPPED` action. Di-disable jika `MARK_SHIPPED` tidak ada dalam daftar `allowedActions`.

Print Label:
- Disabled. Action non-destruktif namun belum dimap di preview layer ini.

Bulk Shipment:
- Disabled explicitly in UI preview.

## Fallback Behavior
- Jika live API gagal, me-return `getOrdersFallback` dan `getOrderDetailFallback` dengan `meta.usingLiveData = false`.
- Saat menggunakan fallback, semua actions (Update Status, Input Tracking) dimatikan.

## UI Behavior
- Loading: Menampilkan teks "Loading orders...".
- Error: Menampilkan pesan error di container jika API error dan fallback tidak dapat dipakai (fallback handle API error, so this rarely triggers unless syntactical).
- Empty: "No orders found".
- Fallback badge: "Preview Data / Live API Unavailable".
- Disabled states: Tombol Tracking, Update Status, Export, Bulk Shipment redup.

## Validasi
Build:
- `✓ built in ...`

Smoke:
- `/seller-2026-preview/:storeSlug/orders`: Lolos
- `/seller-2026-preview/:storeSlug/catalog/products`: Lolos
- `/seller-2026-preview/:storeSlug/catalog/products/new`: Lolos
- `/seller-2026-preview/:storeSlug`: Lolos
- `/seller-2026-preview/:storeSlug/store-profile`: Lolos

Console error:
- Tidak ada error.

Horizontal overflow:
- Tidak ada. Menggunakan flex container standar tanpa width statis yang melebihi viewport.

English UI check:
- Lolos. Semua kata dalam UI (`Orders`, `Products`, `Payment`, `Processing`, dll.) sudah berbahasa Inggris.

Production safety check:
- Zero diff di dalam file legacy seller dan backend.

## Sinkronisasi 3 Aplikasi

Admin:
- Admin/payment audit remains authority for payment governance.
- Parent order truth is not mutated directly.

Seller:
- Orders preview reads seller-scoped suborders.
- Fulfillment actions are guarded.

Storefront:
- Checkout/order creation flow is not changed.
- Buyer order tracking is not changed.

## Duplicate / Merge Notes
- Existing Seller Orders page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Input tracking mungkin membutuhkan format spesifik (regex API existing) yang belum di-mirror di frontend validation. Fallback alert akan keluar jika gagal dari backend.
- Print Label & Bulk Shipment harus menunggu full feature adoption karena sering memakai window/popup logic lama.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PAYMENT-CENTER-LIVE-07`
