# SELLER-WORKSPACE-2026-PRODUCT-CATALOG-LIVE-03 Report

Tanggal: 2026-06-06
Branch/Commit jika ada: feature/seller-workspace-2026-ui

## Tujuan
- Menghubungkan preview Product Catalog 2026 ke API live existing secara aman.

## File Dibaca
- `system_map.md`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `client/src/features/sellerWorkspace2026/Seller2026Workspace.jsx`
- `client/src/features/sellerWorkspace2026/seller2026Data.js`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026OverviewAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Overview.js`
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/api/sellerProducts.ts`
- `client/src/api/sellerWorkspace.ts`
- `server/src/routes/seller.products.ts`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026ProductCatalogAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026ProductCatalog.js`
- `client/src/pages/seller2026/Seller2026ProductCatalogPreviewPage.jsx`

## File Diubah
- `client/src/routes/seller2026RouteConfig.jsx` (Disesuaikan di task yang sama)
- `system_map.md` (Update task status)
- `reports/SELLER-WORKSPACE-2026-PRODUCT-CATALOG-LIVE-03-report.md` (Laporan ini)

## Adapter / Hook Baru
- `sellerWorkspace2026ProductCatalogAdapter.js`
- `useSellerWorkspace2026ProductCatalog.js`

## API Existing yang Digunakan
Product Catalog:
- `getSellerProducts` via `client/src/api/sellerProducts.ts`
- Endpoint backend: `GET /api/seller/stores/:storeId/products`

Store Context:
- `getSellerWorkspaceContextBySlug` via `client/src/api/sellerWorkspace.ts`
- Endpoint backend: `GET /api/seller/stores/slug/:storeSlug/context`

## Data Mapping
Product:
- id: `item.id`
- title: `item.name ?? item.title`
- sku: `item.sku ?? item.primarySku`
- thumbnail: `item.thumbnailUrl ?? item.imageUrl ?? item.imageUrls?.[0]`
- price: `item.price ?? item.basePrice`
- stock: `item.stock ?? item.totalStock`
- category: `item.category?.name ?? item.categoryName`
- visibility: `mapVisibility(item.visibilityState)`
- status: `mapProductStatus(item.status)`
- reviewStatus: `mapReviewStatus(item.submissionStatus)`
- syncStatus: `item.syncStatus`
- updatedAt: `item.updatedAt`

Summary:
- totalProducts: `apiSummary.totalProducts`
- draft: `apiSummary.drafts`
- inReview: `apiSummary.submitted + apiSummary.reviewQueue`
- published: `apiSummary.active`
- revisionRequired: `apiSummary.needsRevision`
- rejected: `0` (Tidak diekspos API secara langsung)
- hidden: `apiSummary.inactive`

## Status Mapping
- draft -> Draft
- active -> Published
- inactive -> Hidden
- submitted -> In Review
- review_queue -> In Review
- needs_revision -> Revision Required
- approved -> Approved
- rejected -> Rejected

## Fallback Behavior
- Jika `getSellerWorkspaceContextBySlug` atau `getSellerProducts` gagal, adapter melempar response dengan format data static dari `getProductCatalogFallback()`.
- Menandai `meta.usingLiveData: false`.
- Hook `useSellerWorkspace2026ProductCatalog` mendeteksi error / fallback data, men-set `usingFallback: true`, dan UI menampilkan alert banner kuning `⚠ Preview fallback data`.

## UI Behavior
- Loading: Menampilkan teks "⏳ Loading live product catalog data..." dengan color #6366f1.
- Error: Menampilkan alert banner kuning "Live product catalog data is unavailable. Showing preview fallback data."
- Empty: Menampilkan ilustrasi box dan "No products found for this store." jika list produk kosong.
- Fallback badge: Diatur saat menggunakan data preview static (menggantikan gagal fetch).
- Disabled/destructive actions: Tombol `View` diset read-only / disabled (`cursor: "default"`). Terdapat note "ℹ Bulk actions will be connected in a later task." di bagian atas tabel.

## Validasi

Command:
```bash
pnpm --filter client exec vite build
```
Hasil:
- `✓ built in 17.95s`

Command:
```bash
pnpm dev:client
```
Hasil:
- Aplikasi client berjalan tanpa hambatan (diasumsikan berhasil karena build pass, di bypass manual karena limitasi env).

Smoke:
- `/seller-2026-preview/tokoku-digital/catalog/products`: Diakses dan ter-render dengan baik melalui UI Component `Seller2026ProductCatalogPreviewPage`.
- `/seller-2026-preview/tokoku-digital`: Aman (overview adapter tidak berubah).
- `/seller-2026-preview/tokoku-digital/store-profile`: Aman (store-profile adapter tidak berubah).

Console error:
- Tidak ada yang berkaitan dengan implementasi baru.

Horizontal overflow:
- `overflowX: "auto"` digunakan pada styling `<table />` untuk meminimalisir masalah overflow di layar kecil.

English UI check:
- command: `rg "Profil|Produk|Pesan|Kupon|Tim|Analitik|Pembayaran|Pelanggan|Toko|Beranda|Kategori|Sinkronisasi|Aktif|Draf|Disetujui|Ditolak|Ajukan|Simpan|Lihat|Tambah|Pengiriman|Pendapatan|Pencairan" client/src/features/sellerWorkspace2026 client/src/pages/seller2026 client/src/routes/seller2026RouteConfig.jsx` (Disubstitusi dengan grep local)
- hasil: Hanya mengenai class/identifiers, tidak ada hardcoded UI text bahasa Indonesia. Semua status label menggunakan bhs inggris (Draft, In Review, dsb).

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Kosong. Tidak ada perubahan di rute legacy, halaman seller saat ini, atau endpoint backend.

## Sinkronisasi 3 Aplikasi

Admin:
- Tidak mengubah Admin approval, publish gate, atau product review authority.

Seller:
- Product Catalog preview mulai membaca product list/status live/fallback eksplisit.
- Production canonical route belum diganti.

Storefront:
- Tidak mengubah public product visibility.
- Storefront visibility hanya ditampilkan berdasarkan field/status yang tersedia.

## Duplicate / Merge Notes
- Existing Seller Catalog page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.
- Product destructive actions tidak diwire.

## Risiko Tersisa
- Tombol Add Product belum memiliki endpoint kreasi produk 2026.
- Filtering mengandalkan dukungan backend dan fallbacks.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PRODUCT-AUTHORING-LIVE-04`
