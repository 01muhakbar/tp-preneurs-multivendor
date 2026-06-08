# SELLER-WORKSPACE-2026-ANALYTICS-STOREFRONT-SYNC-LIVE-10 Report

Tanggal: 2026-06-06
Branch/Commit jika ada:

## Tujuan
- Menghubungkan preview Analytics & Storefront Sync 2026 ke API existing secara aman.

## File Dibaca
- `client/src/api/sellerWorkspace.ts`
- `client/src/api/sellerProducts.ts` (tidak perlu karena `sellerWorkspace` sudah punya `productSnapshot`)
- `client/src/api/sellerStoreProfile.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026AnalyticsSyncAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026AnalyticsSync.js`
- `client/src/pages/seller2026/Seller2026AnalyticsSyncPreviewPage.jsx`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js` (menambahkan mock data Analytics/Sync)
- `client/src/routes/seller2026RouteConfig.jsx` (menambahkan path `/analytics-sync`)
- `client/src/pages/seller2026/Seller2026Pages.jsx` (exporting preview page)
- `system_map.md` (mengubah status menjadi `PREVIEW_LIVE_ADAPTER_COMPLETE`)

## Adapter / Hook Baru
- `sellerWorkspace2026AnalyticsSyncAdapter.js`: Menggabungkan call `getSellerStoreProfile` dan `getSellerAnalyticsSummary` untuk mengkonversi response legacy ke model `Analytics Sync 2026`.
- `useSellerWorkspace2026AnalyticsSync.js`: Menghandle data binding ke komponen dan memblokir mutation untuk sinkronisasi storefront index, memastikan komponen berjalan dalam preview mode murni (read-only mode).

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile(storeSlug)`

Analytics:
- `getSellerAnalyticsSummary(storeId)` (revenue, orders, orderSeries, dsb)

Product Performance:
- Diambil dari field `productSnapshot.topProducts` yang dikembalikan oleh `getSellerAnalyticsSummary`.

Storefront Identity / Sync:
- Mengandalkan data identitas (logo, name, slug) dari `getSellerStoreProfile` serta status produk `storefrontVisibleProducts` dari `getSellerAnalyticsSummary` untuk menghasilkan metric `syncHealth`.

## Data Mapping
Analytics:
- `revenue` <- `revenueSnapshot.paidGrossAmount`
- `orders` <- `orderSnapshot.paidOrders`
- `averageOrderValue` <- `revenueSnapshot.averageOrderValue`
- `visitors` dan `productViews` -> Mocking sederhana dari total order untuk preview UI, karena tak tersedia di API analytics existing.
- `conversionRate` -> Mocking untuk preview UI.
- `channelPerformance` -> Fallback mock karena tak dikembalikan API existing.
- `Series (Chart)` -> Fallback mock untuk visualisasi trend.

Product Performance:
- Map property `productId`, `name`, `slug` (pengganti `sku` jika kosong), `qtySold` (`unitsSold`), `revenueAmount`, dan `storefrontVisible`. `views` dimock menggunakan base multiplier dari `qtySold`.

Storefront Sync:
- `syncHealth`: `Healthy` jika status Store adalah `Active`, `Needs Attention` jika sebaliknya.
- `productIndexStatus`: `Healthy` jika `productSnapshot.storefrontVisibleProducts > 0`, sebaliknya `Needs Attention`.
- Issues: Mengembalikan warning `No published products` jika `storefrontVisibleProducts === 0`.
- Flag lainnya seperti `couponBannerStatus` dan `searchIndexStatus` dirender sebagai `Unknown` secara konservatif.

Public Preview:
- `storeName`, `slug`, `logoUrl`, `publicUrl` ditarik langsung dari `storeProfile`. 

Governance:
- `publicVisibilityUnchanged: true`
- `syncMutationEnabled: false`
- `storefrontPreviewReadOnly: true`

## Status Mapping
- Sync Status: Dimapping via `mapSyncStatus` untuk mengkonversi variasi response status (`healthy`, `ready`, dll -> `Healthy`).
- Product Status/Visibility: `mapVisibility` (`published`, `visible`, `active` -> `Visible`, sisanya `Hidden` / `In Review`).

## Storefront Sync Guardrail
Public visibility:
- Murni read-only. Perubahan di UI public preview tidak diwrite ke server, dan adapter memastikan data hanya divisualisasikan.

Sync Now:
- Tombol action dinonaktifkan (attr `disabled=true`) dan event no-op.

Rebuild Index:
- Tombol action dinonaktifkan (attr `disabled=true`) dan event no-op.

Refresh Preview:
- Aktif, hanya menembakkan fungsi `refetch()` ke adapter.

Public Preview:
- Menggunakan visual proxy (mock display element) dan menampilkan warning text `Storefront preview is read-only and does not change public visibility.`

## Fallback Behavior
- Jika call ke API mengalami error atau network lost, komponen akan gracefully beralih ke `getAnalyticsSyncFallback` dan meta `usingLiveData = false`.
- Menampilkan pesan banner UI kuning: `Live analytics or storefront sync data is unavailable. Showing preview fallback data.`

## UI Behavior
- Loading: Data product table menampilkan tulisan "Loading products...".
- Error: UI fail-safe merah.
- Empty: Product table menampilkan "No product data available" jika API kembali tanpa list `topProducts`.
- Fallback badge: Tersedia di header.
- Disabled states: `Sync Now` dan `Rebuild Index` dirender terdisable (opacity 50% atau background abu-abu dengan kursor not-allowed) dan disertai title penjelas `Storefront sync actions will be connected after public visibility workflow validation.`

## Validasi
Build:
- `✓ built in 15.84s`

Smoke:
- `/seller-2026-preview/akbar-cahaya-studio/analytics-sync`: Tampil sempurna, live data analytics terbaca (atau mock fallback muncul bila API kosong), tak ada mutasi.
- `/seller-2026-preview/akbar-cahaya-studio/team`: OK
- `/seller-2026-preview/akbar-cahaya-studio/coupons`: OK
- `/seller-2026-preview/akbar-cahaya-studio/payment-center`: OK
- `/seller-2026-preview/akbar-cahaya-studio/orders`: OK
- `/seller-2026-preview/akbar-cahaya-studio`: OK
- `/seller-2026-preview/akbar-cahaya-studio/store-profile`: OK

Console error:
- Tidak ada console error.

Horizontal overflow:
- Table product scrollable dalam containernya. Layout tidak rusak.

English UI check:
- command: `rg "(Ringkasan|minggu lalu|Selesai|Profil|...)" client/src/features/sellerWorkspace2026...`
- hasil: Hanya ada kata yang disengaja dalam `utils/sellerWorkspace2026Fallbacks.js` dari tugas sebelumnya, tak ada yang memengaruhi UI layer baru. UI 100% english.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Zero diff (tidak ada perubahan pada rute dan layout produksi lama, maupun backend).

## Sinkronisasi 3 Aplikasi

Admin:
- Admin/product governance is not changed.

Seller:
- Analytics & Storefront Sync preview reads available live data/fallback.
- Sync mutations are guarded/disabled unless safe.

Storefront:
- Public visibility is not changed.
- Public storefront preview is read-only.

## Duplicate / Merge Notes
- Existing Seller dashboard/store profile pages tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Beberapa indikator analytics visual (seperti conversion series chart dan channel performance) serta metrics spesifik (`visitors`, `productViews`) di-mock dengan dummy logic dari existing field karena backend tidak menyediakannya.
- Sync action murni disabled, sehingga user preview yang mau mereset index public tidak bisa melakukannya dari versi preview.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-UI-POLISH-PARITY-11`
