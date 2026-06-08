# SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-22 Report

## Tujuan
- Mengadopsi Coupons 2026 ke production Coupons route secara feature-flagged dan reversible.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/App.jsx`
- `client/src/features/sellerWorkspace2026/components/Seller2026Shell.jsx`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report)

## File Diubah
- `client/src/App.jsx`
- `system_map.md`

## Feature Flag
- `VITE_SELLER_WORKSPACE_2026_ENABLED`
- `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED`
- default behavior: Memanggil komponen legacy `Seller2026LiveCouponsPage` (rute existing sebelum adopsi 2026 slice)
- flag on behavior: Memanggil `Seller2026CouponsPreviewPage` dengan prop `productionMode`
- flag off behavior: Fallback kembali ke rute lama `Seller2026LiveCouponsPage`

## Route Mapping
Production:
- `/seller/stores/:storeSlug/catalog/coupons`

Preview:
- `/seller-2026-preview/:storeSlug/coupons`

Legacy rollback:
- Tetap memanggil fungsi render original jika flag off. Preview route dibiarkan exist tanpa penghapusan.

## Production Mode Changes
- Komponen mem-pass `productionMode` ke `Seller2026CouponsPreviewPage` sehingga "Preview fallback data" banner text dimodifikasi menjadi lebih netral "Live coupon data is unavailable. Showing fallback data."
- `Seller2026Shell` tidak akan merender flag string text "Preview Route" pada location pathname `/seller/stores/*`, karena ini sudah secara otomatis matching dan resolve active path dari parameter.

## Guardrail Verification
Create/Edit:
- Mutation buttons dan form interactions diset hard disabled.

Delete/Archive:
- Actions sepenuhnya disabled, hook `deleteCoupon` di-stubbed-out karena confirmation flow dan safe scope validation belum terselesaikan. 

Platform/admin coupon:
- Adapter membedakan coupon atribusi dan mematikan actions list sepenuhnya di UI maupun Hook bagi coupons tanpa flag `sellerOwned` scope yang diatur di API.

Checkout validation:
- Tidak ada yang berubah. Ada notice tambahan: "Checkout coupon validation is not changed by this workspace" pada summary.

Attribution:
- Mapping Store Coupon, Platform Coupon, dan Partner Coupon telah berjalan dari task harden sebelumnya (SELLER-WORKSPACE-2026-PROD-HARDEN-COUPONS-21) dan akan tetap berjalan konsisten di production mode.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 21.48s`

Smoke flag off:
- production coupons: Render legacy `Seller2026LiveCouponsPage` berhasil dipanggil
- preview coupons: Aman memakai view 2026
- production orders: Legacy (atau flag adopted 2026 mode) aman
- production store profile: Legacy/live adopted aman
- production catalog: Legacy aman
- production add product: Legacy aman
- production product detail: Legacy aman

Smoke flag on:
- production coupons: Render `Seller2026CouponsPreviewPage` aman, tidak error
- preview coupons: Tetap berjalan independen
- production orders: Aman
- production store profile: Aman
- production catalog: Aman
- production add product: Aman
- production product detail: Aman

Console error:
- Bebas error dan unmount updates.

Horizontal overflow:
- Responsive, container membatasi tabel overflow x di overflow area viewport terkecil.

English UI:
- Menggunakan parameter default language yang konsisten (Bahasa Inggris)

Production safety check:
- command: `git diff -- client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: zero diff, validasi tidak merusak env backend dan production wrapper original.

## Rollback Plan
- Set `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED=false`
- Restart/rebuild client
- Production Coupons route returns to legacy Coupons page
- Preview route remains available
- No backend rollback required

## Risiko Tersisa
- Tidak ada. Seluruh form mutasi tidak aktif, meniadakan resiko kerusakan/conflict data yang berkaitan dengan validasi checkout atau attribution lintas scope.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-HARDEN-TEAM-23`
