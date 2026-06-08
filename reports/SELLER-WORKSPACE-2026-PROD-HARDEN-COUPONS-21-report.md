# SELLER-WORKSPACE-2026-PROD-HARDEN-COUPONS-21 Report

## Tujuan
- Harden Coupons 2026 attribution dan mutation guardrail sebelum production adoption.

## File Dibaca
- `system_map.md`
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026CouponsPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026CouponsAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Coupons.js`

## File Ditambahkan
- (Tidak ada file baru ditambahkan selain report ini)

## File Diubah
- `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`
- `client/src/pages/seller2026/Seller2026CouponsPreviewPage.jsx`
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026CouponsAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Coupons.js`
- `system_map.md`

## API Audit
List Coupons:
- `fetchSellerWorkspace2026Coupons` memanggil `listSellerCoupons` (GET `/store/coupons`) jika `storeProfile` ditemukan. Endpoint telah dikonfirmasi dan tersedia.

Create Coupon:
- Endpoint tersedia namun workflow form UI belum diadopsi, action tetap disabled di hook dan UI.

Update Coupon:
- Endpoint tersedia namun workflow form UI belum diadopsi, action tetap disabled di hook dan UI.

Delete / Archive Coupon:
- Delete action ada dan endpoint tersedia, namun diamankan / didisable pending confirmation / validation state.

Checkout Validation:
- Validasi promo tidak berubah dan tetap ditangani backend secara independent, tidak dipengaruhi workspace ini. Preview UI hanya menampilkan visual.

## Data Mapping
Coupon:
- Mapping dilakukan dengan hati-hati. Disambungkan dari item model backend ke list view model UI. 

Status:
- mapped to `Active`, `Scheduled`, `Expired`, `Draft`, `Archived`, `Inactive` berdasarkan `active` flag dan `status.code`. Default ke `Unknown`.

Discount Type:
- mapped to `Percentage`, `Fixed Amount`, dan `Free Shipping`.

Owner / Scope:
- mapped to `Store Coupon`, `Platform Coupon`, `Partner Coupon`, atau `Unknown`.
- Mempertimbangkan tipe governance (`sellerOwned`).

Attribution:
- Mengembalikan string `Store`, `Platform`, atau `Partner` agar UI clear.

Allowed Actions:
- Hanya diisi dengan `['EDIT', 'DELETE']` bila `governance.canEdit` adalah `true` dan scope coupon merupakan `Store Coupon`.

## Attribution Guardrail
Store Coupon:
- Diizinkan untuk memanggil action (kecuali saat ini masih di-disable pada hook untuk hardening).

Platform/Admin Coupon:
- Mutation actions sepenuhnya disabled.

Partner Coupon:
- Mutation actions sepenuhnya disabled.

Unknown Scope:
- Mutation actions sepenuhnya disabled.

Checkout validation:
- Tidak berubah. Ditambahkan label notice di preview banner.

## Mutation Hardening
Create:
- Disabled secara eksplisit di hook dan UI.

Edit:
- Disabled secara eksplisit di hook dan UI.

Delete / Archive:
- Disabled. Hook me-return action dengan error message dan UI me-render button sebagai disabled / not-allowed untuk alasan keamanan sampai confirmation flow tersedia.

Confirmation:
- Mengganti semua destructive actions menjadi explicitly blocked karena belum ada confirmation state UI yang dirancang di preview.

## Feature Flag Prepared
- `VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED`
- default: `false`
- route wired: no

## Guardrail Verification
Fallback:
- Disabled semua mutations jika menggunakan data fallback.

Allowed actions:
- Button UI mematuhi allowed actions dan scope attribution.

Attribution:
- Adapter hanya mengijinkan action pada `Store Coupon` (Seller Owned).

Destructive actions:
- Diblokir di hook agar tidak mengirim payload ke API secara tidak sengaja (misalnya tanpa confirmation dialog).

Checkout:
- Diberikan peringatan eksplisit di Preview UI bahwa module ini tidak mempengaruhi logic checkout.

## Validasi

Build:
- `pnpm.cmd --filter client exec vite build`
- result: `✓ built in 21.78s`

Smoke:
- preview coupons: Aman. Teks loading ("Loading live coupon data...") dan notice tampil sesuai instruksi. Mutation button disabled.
- production orders: Legacy fallback bekerja dengan baik. Route tidak tergantikan.
- production store profile: Legacy / Live Storefront bekerja.
- production catalog: Legacy catalog bekerja.
- production add product: Legacy bekerja.
- production product detail: Legacy bekerja.

Console error:
- Tidak ada runtime console errors. Rendering clean.

Horizontal overflow:
- Tabel coupons secara proper dihandle oleh `overflowX: 'auto'` dan parent container sizing.

English UI:
- Menggunakan bahasa Inggris ("Loading live coupon data...", "Coupon mutation requires...", dll.)

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- result: Zero diff untuk rute produksi dan environment server/layout.

## Rollback Plan
- Production Coupons route remains legacy.
- No rollback needed.
- Keep feature flag off.

## Risiko Tersisa
- Tidak ada karena action berbahaya secara sengaja sudah di disable. Form create/edit juga disabled. 

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-PROD-ADOPT-COUPONS-22`
