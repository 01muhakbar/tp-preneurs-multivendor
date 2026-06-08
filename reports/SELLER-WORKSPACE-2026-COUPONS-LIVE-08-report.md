# SELLER-WORKSPACE-2026-COUPONS-LIVE-08 Report

Tanggal: 2026-06-06
Branch/Commit jika ada:

## Tujuan
- Menghubungkan preview Coupons & Promotions 2026 ke API existing secara aman.

## File Dibaca
- `client/src/api/sellerCoupons.ts`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## File Ditambahkan
- `client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026CouponsAdapter.js`
- `client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Coupons.js`
- `client/src/pages/seller2026/Seller2026CouponsPreviewPage.jsx`

## File Diubah
- `client/src/features/sellerWorkspace2026/utils/sellerWorkspace2026Fallbacks.js`
- `client/src/routes/seller2026RouteConfig.jsx`
- `client/src/pages/seller2026/Seller2026Pages.jsx`
- `system_map.md`

## Adapter / Hook Baru
- `sellerWorkspace2026CouponsAdapter.js`: Menggabungkan respons `listSellerCoupons` menjadi view model Coupon list untuk page preview.
- `useSellerWorkspace2026Coupons.js`: Mengatur local state filter, data loading, dan guardrail method `deleteCoupon`. Action mutasi lainnya dibiarkan kosong karena form belum tersedia atau perlu validasi atribusi lebih lanjut.

## API Existing yang Digunakan
Store Context:
- `getSellerStoreProfile`

Coupons:
- `listSellerCoupons(storeId)`
- `deleteSellerCoupon(storeId, couponId)`

Coupon Governance / Attribution:
- Diambil secara inline dari endpoint list yang mengandung object `governance` per item dan root `data.governance`.

## Data Mapping
Coupon:
- Status dimapping berdasarkan properti `active` dan `status.code`.
- Scope dimapping berdasarkan `scopeType` menjadi "Store Coupon" (platform coupon secara implisit tidak akan terload di endpoint store scoped list, jadi default attribution adalah "Store").
- Discount type di-map menjadi "Percentage" atau "Fixed Amount".

Summary:
- Menghitung aktif dan expired kupon dari list API, namun scheduled campaigns, redemptions, revenue, dan conflict warnings dimock untuk saat ini karena endpoint list existing tidak mensupply agregasi level metrics ini.

Conflict Warning:
- Dimock. Fitur ini membutuhkan analisis overlap schedule dari backend yang belum diretas di task ini.

Performance:
- Dimock. Analytics redemption rate belum ada endpoint khusus di frontend level ini.

Governance:
- Memanfaatkan property `governance.sellerCanCreate`, `sellerCanEdit`, `sellerCanManageStatus` dari response API untuk guardrail boolean level page.

## Status Mapping
- `active = true` -> Active
- `status.label` fallback -> Inactive / Expired / Scheduled

## Attribution Guardrail
Store Coupon:
- Dilabeli sebagai `Store Coupon` dan attribution `Store` jika `governance.sellerOwned` adalah true.

Platform Coupon:
- Jika muncul, dilabeli attribution `Platform`.

Partner Coupon:
- Belum ada case di payload `listSellerCoupons`.

Checkout validation:
- Tidak dirubah sama sekali, checkout menggunakan logic backend murni.

Mutation safety:
- Tombol Create Coupon dan Edit Coupon di-disable dan dilabeli warning bahwa validasi campaign dan workflow perlu disiapkan terlebih dahulu. Tombol Delete aktif jika object coupon mengizinkannya (melalui `governance.canEdit`).

## Fallback Behavior
- Apabila API gagal atau data `store` tidak ada, UI menampilkan `getCouponsFallback` (berisi 1 mock coupon aktif) dan menset `meta.usingLiveData: false`.
- Di mode ini, action seperti Delete Coupon dinonaktifkan otomatis.

## UI Behavior
- Loading: "Loading coupons..."
- Error: Menampilkan pesan error text jika API fail dan tidak bisa digantikan fallback (rare case).
- Empty: "No coupons found" pada table view.
- Fallback badge: "Preview Data / Live API Unavailable".
- Disabled states: Tombol "Create Coupon" di header tidak bisa di-click dan memiliki hover title explisit (disabled by guardrail).

## Validasi
Build:
- `✓ built in 16.46s`

Smoke:
- `/seller-2026-preview/akbar-cahaya-studio/coupons`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/payment-center`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/orders`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/catalog/products`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio`: Lolos
- `/seller-2026-preview/akbar-cahaya-studio/store-profile`: Lolos

Console error:
- Tidak ada (0 error unhandled rejection).

Horizontal overflow:
- Tidak ada (table container memiliki max-width scaling dan x-overflow scroll untuk mencegah stretching body).

English UI check:
- command: `rg "(Ringkasan|minggu lalu|Selesai|Profil|...)" client/src/features/sellerWorkspace2026 ...`
- hasil: Hanya mengenai data mock/fallback atau comment. UI components (Seller2026CouponsPreviewPage) clean dari bahasa Indonesia.

Production safety check:
- command: `git diff -- client/src/App.jsx client/src/pages/seller client/src/layouts/SellerLayout.jsx server/src`
- hasil: Zero diff

## Sinkronisasi 3 Aplikasi

Admin:
- Platform/admin coupon governance is not changed.

Seller:
- Coupons preview reads seller/store coupon data if available.
- Coupon mutations are guarded.

Storefront:
- Checkout coupon validation is not changed.
- Storefront promo preview is visual only.

## Duplicate / Merge Notes
- Existing Seller Coupons page tidak dihapus.
- Route legacy tidak dihapus.
- Backend tidak diubah.

## Risiko Tersisa
- Tidak ada data metrics redemption performance atau conflict warnings riil karena backend response saat ini tidak mensupply data aggregasi kampanye lintas store di endpoint ini.
- Update/Create coupons masih dimatikan UI-nya karena arsitektur payload form preview belum dirancang. Action satu-satunya yang hidup hanyalah delete.

## Rekomendasi Next Task
- `SELLER-WORKSPACE-2026-TEAM-LIVE-09`
