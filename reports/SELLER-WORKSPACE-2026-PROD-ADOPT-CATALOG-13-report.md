# SELLER-WORKSPACE-2026-PROD-ADOPT-CATALOG-13 Report

## Tujuan
- Mengadopsi Product Catalog 2026 ke production route secara feature-flagged dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/App.jsx`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `client/src/pages/seller/SellerCatalogPage.jsx`
- `client/src/pages/seller2026/Seller2026ProductCatalogPreviewPage.jsx`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`

## File Diubah
- `client/src/App.jsx`
- `client/src/pages/seller2026/Seller2026ProductCatalogPreviewPage.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED`
- default behavior: `false` (Jika undefined, legacy route yang dipakai).
- flag on behavior: Me-render `Seller2026ProductCatalogPreviewPage` dengan prop `productionMode={true}`.
- flag off behavior: Me-render legacy `Seller2026LiveProductsPage` komponen lama (atau `SellerCatalogPage` lewat legacy import mapping jika ada).

## Route Mapping
Production:
- `/seller/stores/:storeSlug/catalog/products`

Preview:
- `/seller-2026-preview/:storeSlug/catalog/products`

Legacy rollback:
- Tetap diarahkan ke `<Seller2026LiveProductsPage />` di dalam root `/seller/stores/:storeSlug/catalog/products`.

## Production Mode Changes
- Menyembunyikan text "Preview route: /seller-2026-preview/...".
- Tombol Add Product kini di-hardcode ke absolute path `/seller/stores/:storeSlug/catalog/products/new`.
- Teks pada notice bulk actions lebih eksplisit menegaskan disable-state karena alasan production safety.
- Fallback message error diubah menjadi neutral (live product catalog data is unavailable).

## Guardrail Verification
Bulk actions:
- Dinonaktifkan dengan notice `Bulk actions will be connected after production safety validation.`.

Destructive actions:
- Tombol per-row action terbatas pada "View" (yang saat ini didisable atau safe read-only label). Action delete/archive tidak aktif.

Product publish:
- Tabel Product Catalog 2026 sifatnya `GET`-only. Semua toggle mutation off.

Add Product route:
- Menunjuk ke `/seller/stores/:storeSlug/catalog/products/new`.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 16.68s`

Smoke flag off:
- production catalog: Menampilkan komponen legacy `Seller2026LiveProductsPage`.
- preview catalog: Menampilkan `Seller2026ProductCatalogPreviewPage`.

Smoke flag on:
- production catalog: Menampilkan komponen `Seller2026ProductCatalogPreviewPage` baru dengan behavior `productionMode`.
- preview catalog: Menampilkan komponen baru, tetapi UI preview mode tetap aktif (label dan route info tampil normal).

Console error:
- Bersih.

Horizontal overflow:
- Clean. Container constraint 2026.

English UI:
- Copy writing tetap berbahasa Inggris 100%.

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff (bersih). Modifikasi flag aman dan isolated di `App.jsx`.

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED=false` pada env server.
- Restart/rebuild client.
- Production route returns to legacy `Seller2026LiveProductsPage` (legacy Catalog page).
- Preview route remains available untuk development.
- No backend rollback required.

## Risiko Tersisa
- Tombol View masih disabled/mocked. Pada task berikutnya harus dicarikan rute edit atau route read-only produk jika live `SellerProductDetailPage` yang ada digunakan.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-PRODUCT-DETAIL-14`
